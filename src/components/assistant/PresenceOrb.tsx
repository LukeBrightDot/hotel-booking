'use client';

import { motion } from 'framer-motion';

interface PresenceOrbProps {
  state: 'idle' | 'listening' | 'speaking' | 'thinking';
  className?: string;
}

export function PresenceOrb({ state, className = '' }: PresenceOrbProps) {
  // Animation configs with proper typing
  const speakingAnimation = {
    scale: [1, 1.15, 1.05, 1.12, 1],
    opacity: [0.8, 1, 0.9, 1, 0.8],
  };

  const listeningAnimation = {
    scale: [1, 1.08, 1],
    opacity: [0.7, 0.9, 0.7],
  };

  const thinkingAnimation = {
    scale: [1, 1.03, 1],
    opacity: [0.6, 0.8, 0.6],
  };

  const idleAnimation = {
    scale: [1, 1.02, 1],
    opacity: [0.5, 0.6, 0.5],
  };

  const getAnimation = () => {
    switch (state) {
      case 'speaking':
        return speakingAnimation;
      case 'listening':
        return listeningAnimation;
      case 'thinking':
        return thinkingAnimation;
      default:
        return idleAnimation;
    }
  };

  const getTransitionDuration = () => {
    switch (state) {
      case 'speaking':
        return 1.2;
      case 'listening':
        return 1.5;
      case 'thinking':
        return 2;
      default:
        return 4;
    }
  };

  const getGlowShadows = () => {
    switch (state) {
      case 'speaking':
        return [
          '0 0 60px rgba(124, 181, 179, 0.4)',
          '0 0 100px rgba(124, 181, 179, 0.6)',
          '0 0 60px rgba(124, 181, 179, 0.4)',
        ];
      case 'listening':
        return [
          '0 0 50px rgba(217, 160, 33, 0.3)',
          '0 0 80px rgba(217, 160, 33, 0.5)',
          '0 0 50px rgba(217, 160, 33, 0.3)',
        ];
      case 'thinking':
        return [
          '0 0 40px rgba(124, 181, 179, 0.2)',
          '0 0 60px rgba(124, 181, 179, 0.4)',
          '0 0 40px rgba(124, 181, 179, 0.2)',
        ];
      default:
        return [
          '0 0 40px rgba(124, 181, 179, 0.2)',
          '0 0 50px rgba(124, 181, 179, 0.3)',
          '0 0 40px rgba(124, 181, 179, 0.2)',
        ];
    }
  };

  const getOrbColor = () => {
    switch (state) {
      case 'listening':
        return 'radial-gradient(circle, rgba(217, 160, 33, 0.8) 0%, rgba(217, 160, 33, 0.4) 40%, transparent 70%)';
      case 'speaking':
      case 'thinking':
      default:
        return 'radial-gradient(circle, rgba(124, 181, 179, 0.9) 0%, rgba(124, 181, 179, 0.5) 40%, transparent 70%)';
    }
  };

  const duration = getTransitionDuration();

  return (
    <div className={`relative ${className}`}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ boxShadow: getGlowShadows() }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        }}
        style={{
          width: '120px',
          height: '120px',
          left: '-20px',
          top: '-20px',
        }}
      />

      {/* Main orb */}
      <motion.div
        className="relative rounded-full"
        animate={getAnimation()}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        }}
        style={{
          width: '80px',
          height: '80px',
          background: getOrbColor(),
        }}
      />

      {/* Inner core */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          opacity: state === 'speaking' ? [0.8, 1, 0.8] : [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: state === 'speaking' ? 0.8 : 2,
          repeat: Infinity,
          ease: 'easeInOut' as const,
        }}
        style={{
          width: '30px',
          height: '30px',
          left: '25px',
          top: '25px',
          background:
            state === 'listening'
              ? 'radial-gradient(circle, rgba(217, 160, 33, 1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124, 181, 179, 1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
