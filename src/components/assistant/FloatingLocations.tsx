'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';

const EXOTIC_LOCATIONS = [
  'Bali', 'Maldives', 'Santorini', 'Tokyo', 'Paris',
  'Sydney', 'New York', 'Marrakech', 'Iceland', 'Patagonia',
  'Amalfi Coast', 'Seychelles', 'Kyoto', 'Dubai', 'Cape Town',
  'Bora Bora', 'Venice', 'Swiss Alps', 'Maui', 'Tuscany'
];

interface FloatingLocation {
  id: number;
  name: string;
  angle: number;
  radius: number;
  opacity: number;
  scale: number;
  rotationSpeed: number;
  phaseOffset: number;
}

interface FloatingLocationsProps {
  isActive?: boolean;
  radius?: number;
  className?: string;
}

export const FloatingLocations: React.FC<FloatingLocationsProps> = ({
  isActive = true,
  radius = 200,
  className = '',
}) => {
  const [locations, setLocations] = useState<FloatingLocation[]>([]);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const generateLocations = useCallback(() => {
    const shuffled = [...EXOTIC_LOCATIONS].sort(() => Math.random() - 0.5);
    const count = 8;

    return shuffled.slice(0, count).map((name, index) => ({
      id: Date.now() + index,
      name,
      angle: (index / count) * Math.PI * 2 + Math.random() * 0.3,
      radius: radius + (Math.random() - 0.5) * 60,
      opacity: 0.5 + Math.random() * 0.5,
      scale: 0.85 + Math.random() * 0.3,
      rotationSpeed: 0.0003 + Math.random() * 0.0002,
      phaseOffset: Math.random() * Math.PI * 2,
    }));
  }, [radius]);

  useEffect(() => {
    if (!isActive) {
      setLocations([]);
      return;
    }

    const newLocations = generateLocations();
    setLocations(newLocations);

    const interval = setInterval(() => {
      setLocations(prev => {
        const shuffled = [...EXOTIC_LOCATIONS].sort(() => Math.random() - 0.5);
        const newLocs = [...prev];
        const replaceCount = 2 + Math.floor(Math.random() * 2);

        for (let i = 0; i < replaceCount; i++) {
          const replaceIndex = Math.floor(Math.random() * newLocs.length);
          const newName = shuffled.find(n => !newLocs.some(l => l.name === n)) || shuffled[0];

          newLocs[replaceIndex] = {
            ...newLocs[replaceIndex],
            id: Date.now() + i,
            name: newName,
            opacity: 0,
          };
        }

        return newLocs;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, generateLocations]);

  useEffect(() => {
    if (!isActive || locations.length === 0) return;

    const animate = () => {
      timeRef.current += 16;

      setLocations(prev => prev.map(loc => ({
        ...loc,
        angle: loc.angle + loc.rotationSpeed * 16,
        opacity: Math.min(loc.opacity + 0.02, 0.5 + Math.random() * 0.3),
      })));

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, locations.length]);

  if (!isActive) return null;

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-visible ${className}`}>
      {locations.map((location) => {
        const x = Math.cos(location.angle) * location.radius;
        const y = Math.sin(location.angle) * location.radius;
        const pulse = Math.sin(timeRef.current * 0.002 + location.phaseOffset) * 0.1 + 1;

        return (
          <div
            key={location.id}
            className="absolute left-1/2 top-1/2 transition-opacity duration-1000"
            style={{
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${location.scale * pulse})`,
              opacity: location.opacity,
            }}
          >
            <span
              className="text-xs tracking-[0.2em] uppercase font-light whitespace-nowrap"
              style={{ color: 'hsl(30 10% 50%)' }}
            >
              {location.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingLocations;
