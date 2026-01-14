'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';

interface HotelResult {
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

interface HotelResultsProps {
  results: HotelResult[];
  onSelectHotel?: (hotel: HotelResult) => void;
}

export function HotelResults({ results, onSelectHotel }: HotelResultsProps) {
  if (results.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-gray-500 text-center mb-6"
      >
        {results.length} hotels found
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {results.slice(0, 6).map((hotel, index) => (
            <motion.div
              key={hotel.hotelCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
              onClick={() => onSelectHotel?.(hotel)}
              className="bg-white rounded-xl overflow-hidden shadow-md cursor-pointer transition-shadow"
            >
              {/* Image placeholder */}
              <div className="h-32 bg-gradient-to-br from-teal-100 to-teal-50 flex items-center justify-center">
                {hotel.imageUrl ? (
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.hotelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl opacity-30">🏨</span>
                )}
              </div>

              <div className="p-4">
                {/* Star rating */}
                <div className="flex items-center gap-0.5 mb-2">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Hotel name */}
                <h3 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1">
                  {hotel.hotelName}
                </h3>

                {/* Address */}
                <div className="flex items-start gap-1 mb-3">
                  <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {hotel.address}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-bold text-teal-700">
                      ${hotel.lowestRate}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">/night</span>
                  </div>
                  {hotel.distance && (
                    <span className="text-xs text-gray-400">
                      {hotel.distance}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {results.length > 6 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-gray-400 mt-6"
        >
          + {results.length - 6} more options
        </motion.p>
      )}
    </motion.div>
  );
}
