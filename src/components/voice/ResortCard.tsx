"use client";

import React from 'react';
import Image from 'next/image';
import { LuxuryBadgeGroup } from '@/components/hotel/LuxuryBadge';
import type { LuxuryProgram } from '@/lib/data/luxury-mapping';

export interface Resort {
  id: string;
  name: string;
  location: string;
  description: string;
  pricePerNight: string;
  rating: number;
  amenities: string[];
  imageUrl?: string;
  luxuryPrograms?: LuxuryProgram[];
  isLuxury?: boolean;

  // NEW FIELDS:
  distance?: number;           // Distance in miles
  chainCode?: string | null;   // Chain code (DT, HH, etc.)
  chainName?: string | null;   // Full chain name
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
      className={`group ${className}`}
      onClick={onClick}
      style={{
        borderRadius: '0.75rem',
        transition: 'all 500ms',
        cursor: onClick ? 'pointer' : 'default',
        background: 'hsl(30 20% 96% / 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid hsl(30 15% 88% / 0.5)',
        padding: '1.5rem',
        animationDelay: `${index * 150}ms`,
        animation: 'cardEntrance 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'hsl(30 20% 96% / 0.8)';
        e.currentTarget.style.borderColor = 'hsl(15 55% 70% / 0.3)';
        e.currentTarget.style.boxShadow = '0 0 60px hsl(15 55% 70% / 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'hsl(30 20% 96% / 0.5)';
        e.currentTarget.style.borderColor = 'hsl(30 15% 88% / 0.5)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {resort.imageUrl && (
        <div
          className="relative overflow-hidden"
          style={{
            height: '12rem',
            marginBottom: '1.25rem',
            borderRadius: '0.5rem',
            background: 'hsl(30 15% 92%)'
          }}
        >
          <Image
            src={resort.imageUrl}
            alt={resort.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, hsl(30 20% 6% / 0.6), transparent)' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 200,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: 'hsl(30 15% 45%)'
            }}
          >
            {resort.location}
          </span>
          {resort.distance && (
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.7rem',
                color: 'hsl(30 15% 60%)',
                fontWeight: 300,
              }}
            >
              • {resort.distance.toFixed(1)} mi
            </span>
          )}
        </div>

        <h3
          className="group-hover:text-primary transition-colors"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '1.25rem',
            fontWeight: 300,
            color: 'hsl(30 20% 15%)'
          }}
        >
          {resort.name}
        </h3>

        {/* Chain Badge */}
        {resort.chainCode && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.375rem',
              background: 'hsl(30 20% 94%)',
              alignSelf: 'flex-start',
              marginTop: '-0.25rem',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '0.7rem',
                fontWeight: 500,
                color: 'hsl(30 15% 45%)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {resort.chainName || resort.chainCode}
            </span>
          </div>
        )}

        {/* Luxury Badges */}
        {resort.isLuxury && resort.luxuryPrograms && resort.luxuryPrograms.length > 0 && (
          <div style={{ marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
            <LuxuryBadgeGroup
              programs={resort.luxuryPrograms}
              size="sm"
              maxVisible={2}
              animated
            />
          </div>
        )}

        <p
          style={{
            fontSize: '0.875rem',
            color: 'hsl(30 15% 45%)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {resort.description}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem' }}>
          {resort.amenities.slice(0, 3).map((amenity, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.625rem',
                borderRadius: '9999px',
                background: 'hsl(30 20% 92% / 0.5)',
                color: 'hsl(30 20% 25%)'
              }}
            >
              {amenity}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            paddingTop: '1rem',
            borderTop: '1px solid hsl(30 15% 88% / 0.3)'
          }}
        >
          <div>
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontWeight: 200,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                color: 'hsl(30 15% 45%)',
                display: 'block',
                marginBottom: '0.25rem'
              }}
            >
              From
            </span>
            <span
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.125rem',
                color: 'hsl(30 20% 15%)'
              }}
            >
              {resort.pricePerNight}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'hsl(30 15% 45%)' }}> / night</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ color: 'hsl(42 65% 50%)' }}>★</span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 300,
                color: 'hsl(30 20% 15%)'
              }}
            >
              {resort.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResortCard;
