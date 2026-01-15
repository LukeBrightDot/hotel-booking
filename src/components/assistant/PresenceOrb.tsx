'use client';

import { motion } from 'framer-motion';

interface PresenceOrbProps {
  state: 'idle' | 'listening' | 'speaking' | 'thinking';
  className?: string;
}

export function PresenceOrb({ state, className = '' }: PresenceOrbProps) {
  // Number of bars for the waveform (iPhone-style)
  const barCount = 24;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  // Get bar height based on state and position
  const getBarHeight = (index: number) => {
    const center = barCount / 2;
    const distanceFromCenter = Math.abs(index - center);
    const normalizedDistance = distanceFromCenter / center;

    switch (state) {
      case 'speaking':
        // Active waveform - varies by position
        return {
          height: [
            10 + Math.random() * 40,
            60 - normalizedDistance * 30,
            10 + Math.random() * 40,
          ],
        };
      case 'listening':
        // Gentle pulse from center
        return {
          height: [
            20,
            40 - normalizedDistance * 20,
            20,
          ],
        };
      case 'thinking':
        // Slow wave pattern
        return {
          height: [
            15,
            25 - normalizedDistance * 10,
            15,
          ],
        };
      default:
        // Idle - minimal height
        return {
          height: [10, 12, 10],
        };
    }
  };

  const getAnimationSpeed = () => {
    switch (state) {
      case 'speaking':
        return 0.6;
      case 'listening':
        return 1.2;
      case 'thinking':
        return 2.0;
      default:
        return 3.0;
    }
  };

  const getBarColor = () => {
    switch (state) {
      case 'listening':
        return '#D9A021'; // Gold
      case 'speaking':
        return '#2C5F63'; // Teal
      case 'thinking':
        return '#7CB5B3'; // Light teal
      default:
        return '#CBD5E1'; // Gray
    }
  };

  return (
    <div className={`relative flex items-end justify-center gap-1.5 ${className}`}>
      {bars.map((index) => (
        <motion.div
          key={index}
          className="w-1.5 rounded-full"
          style={{
            backgroundColor: getBarColor(),
            transformOrigin: 'bottom',
          }}
          animate={getBarHeight(index)}
          transition={{
            duration: getAnimationSpeed(),
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * 0.02, // Stagger for wave effect
          }}
        />
      ))}
    </div>
  );
}
