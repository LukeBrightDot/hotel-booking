'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { VoiceAssistantLayout, type DemoState, type Resort } from '@/components/voice';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { SearchHotelsArgs } from '@/lib/assistant/tools';

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

export function AssistantCanvas() {
  const router = useRouter();
  const [displayState, setDisplayState] = useState<DemoState>('idle');
  const hasConnectedRef = useRef(false);

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

  // Update display state based on assistant state
  useEffect(() => {
    const mapToVoiceState = (): DemoState => {
      if (searchResults.length > 0 && displayState !== 'searching') {
        return 'results';
      }
      if (displayState === 'searching') return 'searching';
      if (assistantState === 'speaking') return 'speaking';
      if (assistantState === 'listening') return 'listening';
      if (assistantState === 'thinking') return 'searching';
      return 'idle';
    };

    const newState = mapToVoiceState();
    if (newState !== displayState) {
      setDisplayState(newState);
    }
  }, [assistantState, searchResults.length, displayState]);

  // Get transcript text for display
  const displayTranscript = useMemo((): string => {
    if (currentTranscript) return currentTranscript;
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    return lastAssistantMessage?.content || '';
  }, [currentTranscript, messages]);

  // Convert search results to Resort format
  const resorts = useMemo((): Resort[] => {
    return searchResults.slice(0, 6).map(hotel => ({
      id: hotel.hotelCode,
      name: hotel.hotelName,
      location: hotel.address,
      description: hotel.amenities?.slice(0, 2).join(', ') || 'Luxury accommodations',
      pricePerNight: hotel.lowestRate > 0 ? `$${hotel.lowestRate.toFixed(0)}` : 'Call',
      rating: hotel.starRating,
      amenities: hotel.amenities || [],
      imageUrl: hotel.imageUrl,
    }));
  }, [searchResults]);

  // Handle resort card click
  const handleResortSelect = useCallback((resort: Resort) => {
    const hotel = searchResults.find(h => h.hotelCode === resort.id);
    if (hotel) {
      handleSelectHotel(hotel);
    }
  }, [searchResults, handleSelectHotel]);

  // Auto-connect once on mount
  useEffect(() => {
    if (!hasConnectedRef.current && sessionState === 'disconnected') {
      hasConnectedRef.current = true;
      connect();
    }
  }, [sessionState, connect]);

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <VoiceAssistantLayout
      state={displayState}
      transcript={displayTranscript}
      results={displayState === 'results' ? resorts : []}
      onMicToggle={toggleMic}
      onSpeakerToggle={toggleSpeaker}
      isMicMuted={isMuted}
      isSpeakerMuted={!isSpeakerOn}
      onResortSelect={handleResortSelect}
    />
  );
}
