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
        // First, we need to get location data for the destination
        const locationRes = await fetch(
          `/api/locations/autocomplete?query=${encodeURIComponent(args.destination)}`
        );
        const locationData = await locationRes.json();

        // Get the first matching location
        const location =
          locationData.cities?.[0] ||
          locationData.airports?.[0] ||
          locationData.hotels?.[0];

        if (!location) {
          console.log('No location found for:', args.destination);
          return [];
        }

        // Now search for hotels
        const searchRes = await fetch('/api/search/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: {
              code: location.code,
              name: location.name,
              type: location.type,
              latitude: location.latitude,
              longitude: location.longitude,
            },
            checkIn: args.checkInDate,
            checkOut: args.checkOutDate,
            rooms: args.rooms || 1,
            guests: args.guests,
          }),
        });

        const searchData = await searchRes.json();

        if (searchData.success && searchData.results) {
          return searchData.results.map((hotel: {
            hotelCode: string;
            hotelName: string;
            address?: { line1?: string; city?: string };
            starRating: number;
            lowestRate: number;
            currency: string;
            distance?: string;
            amenities?: string[];
          }) => ({
            hotelCode: hotel.hotelCode,
            hotelName: hotel.hotelName,
            address: hotel.address?.line1 || hotel.address?.city || '',
            starRating: hotel.starRating || 3,
            lowestRate: hotel.lowestRate,
            currency: hotel.currency || 'USD',
            distance: hotel.distance,
            amenities: hotel.amenities,
          }));
        }

        return [];
      } catch (error) {
        console.error('Error searching hotels:', error);
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
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Minimal header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="fixed top-0 left-0 right-0 z-50 p-4"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to search</span>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-gray-500">Connecting...</p>
            </motion.div>
          )}

          {/* Error state */}
          {sessionState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-red-500 mb-4">{error || 'Connection failed'}</p>
              <button
                onClick={connect}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
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
              >
                <PresenceOrb state={assistantState} />
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
