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
      className={`group backdrop-blur-sm rounded-xl p-5 transition-all duration-500 cursor-pointer animate-card-entrance ${className}`}
      style={{
        animationDelay: `${index * 150}ms`,
        background: 'hsl(30 30% 99% / 0.8)',
        border: '1px solid hsl(30 20% 90% / 0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(30 30% 99% / 0.95)';
        e.currentTarget.style.borderColor = 'hsl(15 45% 75% / 0.5)';
        e.currentTarget.style.boxShadow = '0 8px 32px hsl(15 30% 70% / 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(30 30% 99% / 0.8)';
        e.currentTarget.style.borderColor = 'hsl(30 20% 90% / 0.5)';
        e.currentTarget.style.boxShadow = 'none';
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
        <span className="text-xs tracking-[0.2em] uppercase font-light" style={{ color: 'hsl(30 10% 50%)' }}>
          {resort.location}
        </span>

        {/* Name */}
        <h3 className="text-lg font-light transition-colors"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'hsl(30 15% 25%)' }}>
          {resort.name}
        </h3>

        {/* Description */}
        {resort.description && (
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'hsl(30 10% 50%)' }}>
            {resort.description}
          </p>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {resort.amenities.slice(0, 3).map((amenity, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'hsl(30 30% 94%)', color: 'hsl(30 15% 40%)' }}
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-3" style={{ borderTop: '1px solid hsl(30 20% 90%)' }}>
          <div>
            <span className="text-xs tracking-wider uppercase block mb-0.5" style={{ color: 'hsl(30 10% 60%)' }}>From</span>
            <span className="text-base" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'hsl(30 15% 25%)' }}>
              {resort.pricePerNight}
            </span>
            <span className="text-xs" style={{ color: 'hsl(30 10% 60%)' }}> / night</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5" style={{ fill: 'hsl(40 45% 55%)', color: 'hsl(40 45% 55%)' }} />
            <span className="text-sm font-light" style={{ color: 'hsl(30 15% 35%)' }}>{resort.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
