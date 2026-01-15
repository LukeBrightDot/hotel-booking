/**
 * Animation utilities and constants for the voice assistant UI
 * Inspired by "Her" movie aesthetic
 */

// Particle configuration
export const PARTICLE_CONFIG = {
  count: 150,
  baseRadius: 120,
  maxRadius: 160,
  minRadius: 80,
  speed: 0.002,
  connectionDistance: 50,
  pulseSpeed: 0.03,
} as const;

// Voice activity levels
export type VoiceActivityLevel = 'idle' | 'listening' | 'speaking' | 'processing';

// Animation timing presets
export const TIMING = {
  slow: 800,
  medium: 400,
  fast: 200,
  extraSlow: 1200,
} as const;

// Easing functions
export const EASING = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  gentle: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// Generate staggered delay for list items
export const staggerDelay = (index: number, baseDelay = 100): number => {
  return index * baseDelay;
};

// Interpolate between two values
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

// Generate HSL color string
export const hslColor = (h: number, s: number, l: number, a = 1): string => {
  return `hsla(${h}, ${s}%, ${l}%, ${a})`;
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// Text animation helpers
export const splitTextIntoWords = (text: string): string[] => {
  return text.split(' ').filter(word => word.length > 0);
};
