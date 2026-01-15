'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ParticleVisualization } from './ParticleVisualization';
import { AnimatedTranscript } from './AnimatedTranscript';
import { FloatingLocations } from './FloatingLocations';
import { ResortCard, type Resort } from './ResortCard';
import { VoiceIndicator } from './VoiceIndicator';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { SearchHotelsArgs } from '@/lib/assistant/tools';
import type { VoiceActivityLevel } from '@/lib/assistant/animations';
import { Loader2 } from 'lucide-react';

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

type AssistantDisplayState = 'idle' | 'listening' | 'speaking' | 'searching' | 'results';

export function AssistantCanvas() {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [displayState, setDisplayState] = useState<AssistantDisplayState>('idle');
  const [showResults, setShowResults] = useState(false);
  const [visibleResultCount, setVisibleResultCount] = useState(0);
  const prevDisplayStateRef = useRef<AssistantDisplayState>('idle');

  // Hotel search handler
  const handleSearchHotels = useCallback(
    async (args: SearchHotelsArgs): Promise<HotelSearchResult[]> => {
      try {
        setDisplayState('searching');
        console.log('🔍 ASSISTANT: Starting hotel search with args:', args);

        const locationRes = await fetch(
          `/api/locations/autocomplete?q=${encodeURIComponent(args.destination)}`
        );
        const locationData = await locationRes.json();

        const location =
          locationData.cities?.[0] ||
          locationData.airports?.[0] ||
          locationData.hotels?.[0];

        if (!location) {
          console.error('❌ ASSISTANT: No location found for:', args.destination);
          return [];
        }

        const searchRes = await fetch('/api/search/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: {
              code: location.code,
              name: location.name,
              type: location.type,
              latitude: location.lat,
              longitude: location.lng,
            },
            checkIn: args.checkInDate,
            checkOut: args.checkOutDate,
            rooms: args.rooms || 1,
            guests: args.guests,
          }),
        });

        const searchData = await searchRes.json();

        if (searchData.success && searchData.results) {
          const mappedResults = searchData.results.map((hotel: {
            hotelCode: string;
            hotelName: string;
            address?: { addressLine1?: string; city?: string; state?: string };
            starRating?: number;
            lowestRate?: number;
            currencyCode?: string;
            distance?: number;
            amenities?: Array<{ code: string; description: string }>;
            thumbnail?: string;
          }) => ({
            hotelCode: hotel.hotelCode,
            hotelName: hotel.hotelName,
            address: hotel.address?.addressLine1 || hotel.address?.city || 'Address not available',
            starRating: hotel.starRating || 3,
            lowestRate: hotel.lowestRate || 0,
            currency: hotel.currencyCode || 'USD',
            distance: hotel.distance ? `${hotel.distance.toFixed(1)} mi` : undefined,
            amenities: hotel.amenities?.map(a => a.description),
            imageUrl: hotel.thumbnail,
          }));

          setDisplayState('results');
          return mappedResults;
        }

        return [];
      } catch (error) {
        console.error('❌ ASSISTANT: Error searching hotels:', error);
        return [];
      }
    },
    []
  );

  const handleSelectHotel = useCallback(
    (hotel: HotelSearchResult) => {
      sessionStorage.setItem('selectedHotel', JSON.stringify(hotel));
      router.push(`/hotels/${hotel.hotelCode}`);
    },
    [router]
  );

  const {
    sessionState,
    assistantState,
    messages,
    currentTranscript,
    isMuted,
    isSpeakerOn,
    error,
    searchResults,
    connect,
    disconnect,
    toggleMic,
    toggleSpeaker,
  } = useRealtimeSession({
    onSearchHotels: handleSearchHotels,
    onSelectHotel: (args) => {
      const hotel = searchResults.find((h) => h.hotelCode === args.hotelCode);
      if (hotel) handleSelectHotel(hotel);
    },
  });

  // Voice waveform simulation
  useEffect(() => {
    if (assistantState === 'speaking' || assistantState === 'listening') {
      const interval = setInterval(() => {
        const baseWave = Math.sin(Date.now() * 0.008) * 0.3;
        const quickWave = Math.sin(Date.now() * 0.02) * 0.2;
        const noise = (Math.random() - 0.5) * 0.3;
        setVoiceIntensity(Math.max(0, Math.min(1, 0.4 + baseWave + quickWave + noise)));
      }, 50);
      return () => clearInterval(interval);
    } else {
      setVoiceIntensity(prev => prev * 0.9);
    }
  }, [assistantState]);

  // Update display state based on assistant state
  useEffect(() => {
    if (searchResults.length > 0 && displayState !== 'searching') {
      setDisplayState('results');
    } else if (assistantState === 'speaking') {
      setDisplayState('speaking');
    } else if (assistantState === 'listening') {
      setDisplayState('listening');
    } else if (displayState !== 'results' && displayState !== 'searching') {
      setDisplayState('idle');
    }
  }, [assistantState, searchResults.length, displayState]);

  // Handle results animation
  useEffect(() => {
    if (displayState === 'results' && searchResults.length > 0) {
      if (prevDisplayStateRef.current !== 'results') {
        setShowResults(false);
        setVisibleResultCount(0);
        setTimeout(() => {
          setShowResults(true);
          searchResults.slice(0, 6).forEach((_, index) => {
            setTimeout(() => {
              setVisibleResultCount(prev => prev + 1);
            }, index * 200);
          });
        }, 300);
      }
    } else {
      setShowResults(false);
      setVisibleResultCount(0);
    }
    prevDisplayStateRef.current = displayState;
  }, [displayState, searchResults]);

  // Get activity level for particle visualization
  const getActivity = (): VoiceActivityLevel => {
    switch (displayState) {
      case 'listening': return 'listening';
      case 'speaking': return 'speaking';
      case 'searching': return 'processing';
      default: return 'idle';
    }
  };

  // Get transcript text
  const getTranscriptText = (): string => {
    if (currentTranscript) return currentTranscript;
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    return lastAssistantMessage?.content || '';
  };

  // Convert search results to Resort format
  const getResorts = (): Resort[] => {
    return searchResults.slice(0, 6).map(hotel => ({
      id: hotel.hotelCode,
      name: hotel.hotelName,
      location: hotel.address,
      description: hotel.amenities?.slice(0, 2).join(', '),
      pricePerNight: hotel.lowestRate > 0 ? `$${hotel.lowestRate.toFixed(0)}` : 'Call',
      rating: hotel.starRating,
      amenities: hotel.amenities || [],
      imageUrl: hotel.imageUrl,
    }));
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isReady && sessionState === 'disconnected') {
      setShowIntro(false);
      connect();
    }
  }, [isReady, sessionState, connect]);

  useEffect(() => {
    return () => {
      if (sessionState === 'connected') disconnect();
    };
  }, [sessionState, disconnect]);

  const isCompact = displayState === 'results' && showResults;

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-16"
         style={{ background: 'hsl(30 25% 98%)' }}>

      {/* Main visualization area */}
      <div className={`relative flex flex-col items-center w-full max-w-4xl transition-all duration-700 ease-out
                      ${isCompact ? 'flex-none' : 'flex-1 justify-center'}`}>

        {/* Status indicator */}
        <div className="mb-6 transition-all duration-500">
          <span className={`text-xs tracking-[0.2em] uppercase font-light transition-opacity duration-300`}
                style={{ color: 'hsl(30 10% 50%)' }}>
            {sessionState === 'connecting' && 'Connecting...'}
            {sessionState === 'connected' && displayState === 'idle' && 'Ready'}
            {sessionState === 'connected' && displayState === 'listening' && 'Listening...'}
            {sessionState === 'connected' && displayState === 'speaking' && 'Speaking'}
            {sessionState === 'connected' && displayState === 'searching' && 'Searching'}
            {sessionState === 'connected' && displayState === 'results' && 'Found for you'}
            {sessionState === 'error' && 'Error'}
          </span>
        </div>

        <AnimatePresence>
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            />
          )}

          {!showIntro && sessionState === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'hsl(15 45% 65%)' }} />
            </motion.div>
          )}

          {sessionState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <p className="text-red-400 mb-6 font-light tracking-wide">{error || 'Connection failed'}</p>
              <button
                onClick={connect}
                className="px-8 py-3 text-white rounded-full hover:shadow-xl transition-all duration-300 font-medium tracking-wide"
                style={{ background: 'hsl(15 45% 65%)' }}
              >
                Try Again
              </button>
            </motion.div>
          )}

          {sessionState === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center w-full"
            >
              {/* Particle visualization with floating locations */}
              <div className={`relative transition-all duration-700 ease-out
                             ${isCompact ? 'scale-75 -mb-8' : 'scale-100'}`}>
                <ParticleVisualization
                  activity={getActivity()}
                  voiceIntensity={voiceIntensity}
                  size={350}
                />
                <FloatingLocations
                  isActive={displayState === 'searching'}
                  radius={220}
                />
              </div>

              {/* Transcript area */}
              <div className={`max-w-2xl w-full min-h-[80px] flex items-center justify-center transition-all duration-500
                             ${isCompact ? 'mt-0 mb-6' : 'mt-8 mb-12'}`}>
                {getTranscriptText() && (
                  <AnimatedTranscript
                    text={getTranscriptText()}
                    isActive={displayState === 'speaking'}
                    speed="medium"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results grid */}
      <div className={`w-full max-w-5xl px-4 pb-32 transition-all duration-700 ease-out
                      ${showResults ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        {displayState === 'results' && searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getResorts().slice(0, visibleResultCount).map((resort, index) => (
              <ResortCard
                key={resort.id}
                resort={resort}
                index={index}
                onClick={() => {
                  const hotel = searchResults.find(h => h.hotelCode === resort.id);
                  if (hotel) handleSelectHotel(hotel);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Voice controls at bottom */}
      {sessionState === 'connected' && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 p-6 flex justify-center"
          style={{ background: 'linear-gradient(to top, hsl(30 25% 98%), transparent)' }}
        >
          <VoiceIndicator
            isListening={assistantState === 'listening'}
            isMuted={isMuted}
            isSpeakerOn={isSpeakerOn}
            onToggleMic={toggleMic}
            onToggleSpeaker={toggleSpeaker}
            showControls={true}
          />
        </motion.footer>
      )}

      {/* Branding */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-xs tracking-[0.3em] uppercase font-light"
              style={{ color: 'hsl(30 10% 70%)' }}>
          Bellhopping AI
        </span>
      </div>
    </div>
  );
}
