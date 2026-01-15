'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SearchHotelsArgs, GetHotelDetailsArgs, SelectHotelArgs } from '@/lib/assistant/tools';

export type SessionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type AssistantState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

interface HotelSearchResult {
  hotelCode: string;
  hotelName: string;
  address: string;
  starRating: number;
  lowestRate: number;
  currency: string;
  distance?: string;
  amenities?: string[];
  imageUrl?: string;
}

interface UseRealtimeSessionOptions {
  onSearchHotels?: (args: SearchHotelsArgs) => Promise<HotelSearchResult[]>;
  onGetHotelDetails?: (args: GetHotelDetailsArgs) => Promise<unknown>;
  onSelectHotel?: (args: SelectHotelArgs) => void;
}

export function useRealtimeSession(options: UseRealtimeSessionOptions = {}) {
  const [sessionState, setSessionState] = useState<SessionState>('disconnected');
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<HotelSearchResult[]>([]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Add a message to the conversation
  const addMessage = useCallback((role: 'assistant' | 'user', content: string) => {
    const message: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  // Handle incoming data channel messages
  const handleDataChannelMessage = useCallback(
    async (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case 'session.created':
            console.log('Session created:', data);
            break;

          case 'input_audio_buffer.speech_started':
            setAssistantState('listening');
            setCurrentTranscript('');
            break;

          case 'input_audio_buffer.speech_stopped':
            setAssistantState('thinking');
            break;

          case 'conversation.item.input_audio_transcription.completed':
            if (data.transcript) {
              addMessage('user', data.transcript);
              setCurrentTranscript('');
            }
            break;

          case 'response.audio_transcript.delta':
            // Streaming transcript from assistant
            setCurrentTranscript((prev) => prev + (data.delta || ''));
            break;

          case 'response.audio_transcript.done':
            if (data.transcript) {
              addMessage('assistant', data.transcript);
              setCurrentTranscript('');
            }
            break;

          case 'response.audio.delta':
            // Audio is playing
            setAssistantState('speaking');
            break;

          case 'response.audio.done':
            setAssistantState('idle');
            break;

          case 'response.function_call_arguments.done':
            // Handle tool calls
            if (data.name === 'searchHotels' && options.onSearchHotels) {
              setAssistantState('thinking');
              try {
                console.log('🔧 HOOK: searchHotels tool called with args:', data.arguments);
                const args = JSON.parse(data.arguments) as SearchHotelsArgs;
                console.log('🔧 HOOK: Calling onSearchHotels handler...');
                const results = await options.onSearchHotels(args);
                console.log('🔧 HOOK: Search completed, got', results.length, 'results');
                setSearchResults(results);

                // Send function result back
                if (dataChannelRef.current?.readyState === 'open') {
                  const hotelSummary = results.length > 0
                    ? results.slice(0, 8).map((h) => ({
                        name: h.hotelName,
                        price: `$${h.lowestRate.toFixed(2)} per night`,
                        stars: h.starRating,
                        location: h.address,
                        distance: h.distance,
                      }))
                    : [];

                  const responsePayload = {
                    type: 'conversation.item.create',
                    item: {
                      type: 'function_call_output',
                      call_id: data.call_id,
                      output: JSON.stringify({
                        success: results.length > 0,
                        count: results.length,
                        message: results.length > 0
                          ? `Found ${results.length} hotels available for your dates.`
                          : 'No hotels found for those dates. Try different dates or a different location.',
                        hotels: hotelSummary,
                      }),
                    },
                  };

                  console.log('🔧 HOOK: Sending results back to AI:', responsePayload);
                  dataChannelRef.current.send(JSON.stringify(responsePayload));

                  // Trigger response generation
                  dataChannelRef.current.send(
                    JSON.stringify({ type: 'response.create' })
                  );
                  console.log('🔧 HOOK: Triggered response.create');
                }
              } catch (err) {
                console.error('❌ HOOK: Error calling searchHotels:', err);

                // Send error back to AI
                if (dataChannelRef.current?.readyState === 'open') {
                  dataChannelRef.current.send(
                    JSON.stringify({
                      type: 'conversation.item.create',
                      item: {
                        type: 'function_call_output',
                        call_id: data.call_id,
                        output: JSON.stringify({
                          success: false,
                          error: 'Failed to search hotels. Please try again.',
                        }),
                      },
                    })
                  );
                  dataChannelRef.current.send(
                    JSON.stringify({ type: 'response.create' })
                  );
                }
              }
            } else if (data.name === 'selectHotel' && options.onSelectHotel) {
              const args = JSON.parse(data.arguments) as SelectHotelArgs;
              options.onSelectHotel(args);
            }
            break;

          case 'error':
            console.error('Realtime API error:', data);
            setError(data.error?.message || 'An error occurred');
            break;
        }
      } catch (err) {
        console.error('Error parsing data channel message:', err);
      }
    },
    [addMessage, options]
  );

  // Initialize the WebRTC connection
  const connect = useCallback(async () => {
    try {
      setSessionState('connecting');
      setError(null);

      // Get ephemeral token from our API
      const tokenResponse = await fetch('/api/realtime/session', {
        method: 'POST',
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get session token');
      }

      const { client_secret } = await tokenResponse.json();

      // Create peer connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Set up audio element for playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      pc.ontrack = (event) => {
        audioEl.srcObject = event.streams[0];
      };

      // Get user microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Create data channel for events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.onopen = () => {
        console.log('Data channel opened');
        setSessionState('connected');
        setAssistantState('idle');
      };

      dc.onmessage = handleDataChannelMessage;

      dc.onerror = (err) => {
        console.error('Data channel error:', err);
        setError('Connection error');
      };

      // Create and set local description
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Connect to OpenAI Realtime API
      const sdpResponse = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${client_secret.value}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpResponse.ok) {
        throw new Error('Failed to connect to Realtime API');
      }

      const answer: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: await sdpResponse.text(),
      };

      await pc.setRemoteDescription(answer);

      // Send initial greeting after a short delay
      setTimeout(() => {
        if (dc.readyState === 'open') {
          dc.send(
            JSON.stringify({
              type: 'response.create',
              response: {
                modalities: ['audio', 'text'],
                instructions:
                  'Greet the user warmly. Introduce yourself as Bell, their personal travel concierge. Tell them you are here to help them find the perfect place to stay. Then ask where they would like to travel.',
              },
            })
          );
        }
      }, 1000);
    } catch (err) {
      console.error('Connection error:', err);
      setSessionState('error');
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
  }, [handleDataChannelMessage]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
    }

    peerConnectionRef.current = null;
    dataChannelRef.current = null;
    mediaStreamRef.current = null;

    setSessionState('disconnected');
    setAssistantState('idle');
    setMessages([]);
    setCurrentTranscript('');
    setSearchResults([]);
  }, []);

  // Toggle microphone
  const toggleMic = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.muted = isSpeakerOn;
      setIsSpeakerOn(!isSpeakerOn);
    }
  }, [isSpeakerOn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // State
    sessionState,
    assistantState,
    messages,
    currentTranscript,
    isMuted,
    isSpeakerOn,
    error,
    searchResults,

    // Actions
    connect,
    disconnect,
    toggleMic,
    toggleSpeaker,
  };
}
