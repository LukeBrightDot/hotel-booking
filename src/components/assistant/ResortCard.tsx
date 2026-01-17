'use client';

import React from 'react';
import { LuxuryBadgeGroup } from '@/components/hotel/LuxuryBadge';
import type { LuxuryProgram } from '@/lib/data/luxury-mapping';

export interface Resort {
  id: string;
  name: string;
  location: string;
  description?: string;
  pricePerNight: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;

  // NEW FIELDS:
  luxuryPrograms?: LuxuryProgram[];
  isLuxury?: boolean;
  distance?: number;
  chainCode?: string | null;
  chainName?: string | null;
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
      className={`group bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6
                  hover:bg-card/80 hover:border-primary/20 hover:shadow-lg
                  transition-all duration-500 cursor-pointer animate-card-entrance ${className}`}
      style={{
        animationDelay: `${index * 150}ms`,
      }}
    >
      {/* Resort Image */}
      {resort.imageUrl && (
        <div className="relative h-48 mb-5 rounded-lg overflow-hidden bg-muted">
          <img
            src={resort.imageUrl}
            alt={resort.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />

          {/* Chain Badge Overlay on Image */}
          {resort.chainCode && resort.chainName && (
            <div
              className="absolute bottom-3 left-3"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.375rem 0.625rem',
                borderRadius: '0.375rem',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'hsl(30 20% 25%)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {resort.chainName}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Resort Info */}
      <div className="space-y-3">
        {/* Location tag with distance */}
        <div className="flex items-center gap-2">
          <span className="text-elegant text-muted-foreground">
            {resort.location}
          </span>
          {resort.distance && (
            <span className="text-xs text-muted-foreground/70">
              • {resort.distance.toFixed(1)} mi
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-serif text-xl font-light text-foreground group-hover:text-primary transition-colors">
          {resort.name}
        </h3>

        {/* Luxury Badges */}
        {resort.isLuxury && resort.luxuryPrograms && resort.luxuryPrograms.length > 0 && (
          <div className="pt-1">
            <LuxuryBadgeGroup
              programs={resort.luxuryPrograms}
              size="sm"
              maxVisible={2}
              animated={false}
            />
          </div>
        )}

        {/* Description */}
        {resort.description && !resort.description.startsWith('Experience luxury at') && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {resort.description}
          </p>
        )}

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 pt-2">
          {resort.amenities.slice(0, 3).map((amenity, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-full bg-secondary/50 text-secondary-foreground"
            >
              {amenity}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between pt-4 border-t border-border/30">
          <div>
            <span className="text-elegant text-muted-foreground block mb-1">From</span>
            <span className="font-serif text-lg text-foreground">{resort.pricePerNight}</span>
            <span className="text-xs text-muted-foreground"> / night</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'hsl(var(--gold))' }}>★</span>
            <span className="text-sm font-light text-foreground">{resort.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
