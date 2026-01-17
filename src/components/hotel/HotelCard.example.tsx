'use client';

/**
 * Hotel Card Component - Example Implementation
 *
 * This is a reference implementation showing how to use the LuxuryBadge
 * components with enriched hotel results.
 *
 * Copy and adapt this for your actual hotel card component.
 */

import { EnrichedHotelResult } from '@/lib/services/hotel-enricher';
import { LuxuryBadgeGroup, LuxuryIndicatorDot } from './LuxuryBadge';
import { MapPin, Star } from 'lucide-react';

interface HotelCardProps {
  hotel: EnrichedHotelResult;
  onClick?: () => void;
}

export function HotelCardExample({ hotel, onClick }: HotelCardProps) {
  return (
    <div
      className="group relative bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {hotel.imageUrl ? (
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            No image
          </div>
        )}

        {/* Luxury Indicator (Top Right) */}
        {hotel.isLuxury && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <LuxuryIndicatorDot isLuxury={true} animated />
          </div>
        )}

        {/* Star Rating (Top Left) */}
        {hotel.starRating && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
            <Star size={14} className="text-amber-400 fill-amber-400" />
            <span className="text-white text-sm font-medium">
              {hotel.starRating}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 space-y-3">
        {/* Hotel Name */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {hotel.name}
        </h3>

        {/* Luxury Badges */}
        {hotel.isLuxury && (
          <div className="py-2">
            <LuxuryBadgeGroup
              programs={hotel.luxuryPrograms}
              size="sm"
              maxVisible={2}
              animated
            />
          </div>
        )}

        {/* Location */}
        {(hotel.city || hotel.address) && (
          <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {hotel.city}
              {hotel.city && hotel.countryCode && ', '}
              {hotel.countryCode}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-end justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <div>
            {hotel.minRate ? (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${hotel.minRate}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  /night
                </span>
              </div>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Price on request
              </span>
            )}

            {hotel.currency && hotel.currency !== 'USD' && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({hotel.currency})
              </span>
            )}
          </div>

          {/* View Details Button */}
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            View Details
          </button>
        </div>
      </div>

      {/* Hover Overlay Effect */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-500 rounded-xl transition-colors pointer-events-none" />
    </div>
  );
}

/**
 * Hotel Grid Component - Example Layout
 */
interface HotelGridProps {
  hotels: EnrichedHotelResult[];
  onHotelClick?: (hotel: EnrichedHotelResult) => void;
}

export function HotelGridExample({ hotels, onHotelClick }: HotelGridProps) {
  const luxuryCount = hotels.filter((h) => h.isLuxury).length;

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {hotels.length} Hotels Found
        </h2>

        {luxuryCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <LuxuryIndicatorDot isLuxury={true} animated={false} />
            <span>
              {luxuryCount} luxury {luxuryCount === 1 ? 'property' : 'properties'}
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {hotels.map((hotel) => (
          <HotelCardExample
            key={hotel.id}
            hotel={hotel}
            onClick={() => onHotelClick?.(hotel)}
          />
        ))}
      </div>

      {/* No Results */}
      {hotels.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          No hotels found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );
}

/**
 * USAGE EXAMPLE:
 *
 * ```tsx
 * // In your search results page
 * 'use client';
 *
 * import { useState, useEffect } from 'react';
 * import { HotelGridExample } from '@/components/hotel/HotelCard.example';
 * import { EnrichedHotelResult } from '@/lib/services/hotel-enricher';
 *
 * export default function SearchResultsPage() {
 *   const [hotels, setHotels] = useState<EnrichedHotelResult[]>([]);
 *
 *   useEffect(() => {
 *     async function fetchHotels() {
 *       const response = await fetch('/api/search/hotels', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({
 *           location: { name: 'Paris', code: 'PAR' },
 *           checkIn: '2026-06-01',
 *           checkOut: '2026-06-05',
 *         }),
 *       });
 *
 *       const data = await response.json();
 *       setHotels(data.results); // Already enriched with luxury data!
 *     }
 *
 *     fetchHotels();
 *   }, []);
 *
 *   const handleHotelClick = (hotel: EnrichedHotelResult) => {
 *     // Navigate to hotel details page
 *     router.push(`/hotels/${hotel.id}`);
 *   };
 *
 *   return (
 *     <div className="container mx-auto px-4 py-8">
 *       <HotelGridExample
 *         hotels={hotels}
 *         onHotelClick={handleHotelClick}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
