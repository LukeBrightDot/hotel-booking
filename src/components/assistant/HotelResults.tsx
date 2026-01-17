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
      className="w-full max-w-6xl mx-auto px-4"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-slate-500 text-center mb-8 font-medium tracking-wide"
      >
        {results.length} hotels found
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {results.slice(0, 6).map((hotel, index) => (
            <motion.div
              key={hotel.hotelCode}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
              onClick={() => onSelectHotel?.(hotel)}
              className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-300 border border-slate-100"
            >
              {/* Image placeholder */}
              <div className="h-40 bg-gradient-to-br from-teal-100 via-blue-50 to-slate-100 flex items-center justify-center relative overflow-hidden">
                {hotel.imageUrl ? (
                  <img
                    src={hotel.imageUrl}
                    alt={hotel.hotelName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl opacity-20">🏨</span>
                )}
              </div>

              <div className="p-5">
                {/* Star rating */}
                <div className="flex items-center gap-0.5 mb-3">
                  {Array.from({ length: hotel.starRating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Hotel name */}
                <h3 className="font-semibold text-slate-800 text-base mb-2 line-clamp-2 leading-tight tracking-tight">
                  {hotel.hotelName}
                </h3>

                {/* Address */}
                <div className="flex items-start gap-1.5 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-500 line-clamp-1 font-medium">
                    {hotel.address}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-baseline justify-between pt-3 border-t border-slate-100">
                  <div>
                    <span className="text-xl font-bold text-teal-600 tracking-tight">
                      ${hotel.lowestRate}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-medium">/night</span>
                  </div>
                  {hotel.distance && (
                    <span className="text-xs text-slate-400 font-medium">
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
          className="text-center text-sm text-slate-400 mt-8 font-medium tracking-wide"
        >
          + {results.length - 6} more options available
        </motion.p>
      )}
    </motion.div>
  );
}
