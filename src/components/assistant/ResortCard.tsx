'use client';

import React from 'react';
import { Star } from 'lucide-react';

export interface Resort {
  id: string;
  name: string;
  location: string;
  description?: string;
  pricePerNight: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;
}

interface ResortCardProps {
  resort: Resort;
  index?: number;
  className?: string;
  onClick?: () => void;
}

export const ResortCard: React.FC<ResortCardProps> = ({
  resort,
  index = 0,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group bg-white/50 backdrop-blur-sm border border-gray-200/50 rounded-xl p-5
                  hover:bg-white/80 hover:border-rose-200/50 hover:shadow-lg
                  transition-all duration-500 cursor-pointer ${className}`}
      style={{
        animationDelay: `${index * 150}ms`,
      }}
    >
      {/* Resort Image */}
      {resort.imageUrl && (
        <div className="relative h-40 mb-4 rounded-lg overflow-hidden bg-gray-100">
          <img
            src={resort.imageUrl}
            alt={resort.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Resort Info */}
      <div className="space-y-2">
        {/* Location tag */}
        <span className="text-xs tracking-[0.2em] uppercase font-light text-gray-500">
          {resort.location}
        </span>

        {/* Name */}
        <h3 className="text-lg font-light text-gray-900 group-hover:text-rose-700 transition-colors"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          {resort.name}
        </h3>

        {/* Description */}
        {resort.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {resort.description}
          </p>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {resort.amenities.slice(0, 3).map((amenity, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs tracking-wider uppercase text-gray-400 block mb-0.5">From</span>
            <span className="text-base text-gray-900" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              {resort.pricePerNight}
            </span>
            <span className="text-xs text-gray-400"> / night</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-sm font-light text-gray-700">{resort.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
