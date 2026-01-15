'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { PresenceOrb } from './PresenceOrb';
import { TranscriptDisplay } from './TranscriptDisplay';
import { VoiceIndicator } from './VoiceIndicator';
import { HotelResults } from './HotelResults';
import { useRealtimeSession } from '@/hooks/useRealtimeSession';
import { SearchHotelsArgs } from '@/lib/assistant/tools';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

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
  const [isReady, setIsReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  // Hotel search handler - calls our existing API
  const handleSearchHotels = useCallback(
    async (args: SearchHotelsArgs): Promise<HotelSearchResult[]> => {
      try {
        console.log('🔍 ASSISTANT: Starting hotel search with args:', args);

        // First, we need to get location data for the destination
        console.log('📍 ASSISTANT: Looking up location for:', args.destination);
        const locationRes = await fetch(
          `/api/locations/autocomplete?q=${encodeURIComponent(args.destination)}`
        );
        const locationData = await locationRes.json();
        console.log('📍 ASSISTANT: Location data received:', locationData);

        // Get the first matching location
        const location =
          locationData.cities?.[0] ||
          locationData.airports?.[0] ||
          locationData.hotels?.[0];

        if (!location) {
          console.error('❌ ASSISTANT: No location found for:', args.destination);
          console.log('Available locations:', locationData);
          return [];
        }

        console.log('✅ ASSISTANT: Found location:', location.name, location.code);

        // Now search for hotels
        console.log('🏨 ASSISTANT: Searching hotels (this may take 5-10 seconds)...');
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
        console.log('🏨 ASSISTANT: Search completed. Success:', searchData.success, 'Count:', searchData.count);

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
          }) => ({
            hotelCode: hotel.hotelCode,
            hotelName: hotel.hotelName,
            address: hotel.address?.addressLine1 || hotel.address?.city || 'Address not available',
            starRating: hotel.starRating || 3,
            lowestRate: hotel.lowestRate || 0,
            currency: hotel.currencyCode || 'USD',
            distance: hotel.distance ? `${hotel.distance.toFixed(1)} mi` : undefined,
            amenities: hotel.amenities?.map(a => a.description),
          }));

          console.log('✅ ASSISTANT: Returning', mappedResults.length, 'hotels to AI');
          console.log('First 3 hotels:', mappedResults.slice(0, 3));
          return mappedResults;
        }

        console.log('⚠️ ASSISTANT: Search returned no results or failed');
        return [];
      } catch (error) {
        console.error('❌ ASSISTANT: Error searching hotels:', error);
        return [];
      }
    },
    []
  );

  // Handle hotel selection
  const handleSelectHotel = useCallback(
    (hotel: HotelSearchResult) => {
      // Store selected hotel and navigate to details
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

  // Start session after intro
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Connect when ready
  useEffect(() => {
    if (isReady && sessionState === 'disconnected') {
      setShowIntro(false);
      connect();
    }
  }, [isReady, sessionState, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionState === 'connected') {
        disconnect();
      }
    };
  }, [sessionState, disconnect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col">
      {/* Minimal header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="fixed top-0 left-0 right-0 z-50 p-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-all duration-200 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm tracking-wide">Back to search</span>
        </Link>
      </motion.header>

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <AnimatePresence mode="wait">
          {/* Initial blank state */}
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            />
          )}

          {/* Connecting state */}
          {!showIntro && sessionState === 'connecting' && (
            <motion.div
              key="connecting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative">
                <Loader2 className="w-16 h-16 text-teal-500 animate-spin" />
                <motion.div
                  className="absolute inset-0 rounded-full bg-teal-500/20"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </div>
              <p className="text-slate-500 font-light text-lg tracking-wide">Connecting...</p>
            </motion.div>
          )}

          {/* Error state */}
          {sessionState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-md"
            >
              <p className="text-red-500 mb-6 font-light tracking-wide">{error || 'Connection failed'}</p>
              <button
                onClick={connect}
                className="px-8 py-3 bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-full hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium tracking-wide"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Connected state - main experience */}
          {sessionState === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center gap-12 w-full"
            >
              {/* Presence orb */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="mb-4"
              >
                <PresenceOrb state={assistantState} className="h-20" />
              </motion.div>

              {/* Transcript display */}
              <TranscriptDisplay
                messages={messages}
                currentTranscript={currentTranscript}
                isListening={assistantState === 'listening'}
              />

              {/* Hotel results */}
              {searchResults.length > 0 && (
                <HotelResults
                  results={searchResults}
                  onSelectHotel={handleSelectHotel}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Voice controls at bottom */}
      {sessionState === 'connected' && (
        <motion.footer
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 p-6 flex justify-center"
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
    </div>
  );
}
