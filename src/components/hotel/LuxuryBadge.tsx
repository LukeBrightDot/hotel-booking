'use client';

/**
 * Luxury Program Badge Component
 *
 * Displays visually distinct badges for luxury hotel programs with animations.
 * Uses Tailwind 4 for styling and Framer Motion for smooth animations.
 */

import { motion } from 'framer-motion';
import { Diamond, Star, Sparkles } from 'lucide-react';
import {
  type LuxuryProgram,
  LUXURY_PROGRAM_INFO,
} from '@/lib/data/luxury-mapping';

interface LuxuryBadgeProps {
  program: LuxuryProgram;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

/**
 * Icon mapping for each luxury program
 */
const PROGRAM_ICONS: Record<LuxuryProgram, React.ComponentType<any>> = {
  VIRTUOSO: Diamond,
  FOUR_SEASONS_PREFERRED: Star,
  RITZ_CARLTON_STARS: Sparkles,
  BELMOND_BELLINI: Diamond,
  ROSEWOOD_ELITE: Star,
  AMAN_PREFERRED: Diamond,
  PENINSULA_PRIVILEGE: Sparkles,
};

/**
 * Size variants for the badge
 */
const SIZE_VARIANTS = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 12,
  },
  md: {
    container: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 14,
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 16,
  },
};

/**
 * Luxury Badge Component
 *
 * @example
 * ```tsx
 * <LuxuryBadge program="VIRTUOSO" />
 * <LuxuryBadge program="FOUR_SEASONS_PREFERRED" showDescription />
 * <LuxuryBadge program="VIRTUOSO" size="lg" animated={false} />
 * ```
 */
export function LuxuryBadge({
  program,
  showDescription = false,
  size = 'md',
  animated = true,
}: LuxuryBadgeProps) {
  const info = LUXURY_PROGRAM_INFO[program];
  const Icon = PROGRAM_ICONS[program];
  const sizeConfig = SIZE_VARIANTS[size];

  // Animation variants
  const shimmerVariants = {
    initial: { opacity: 0.7 },
    animate: {
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const containerVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 30,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      },
    },
  };

  return (
    <motion.div
      className="inline-flex flex-col gap-1"
      variants={animated ? containerVariants : undefined}
      initial={animated ? 'initial' : undefined}
      animate={animated ? 'animate' : undefined}
      whileHover={animated ? 'hover' : undefined}
    >
      {/* Badge */}
      <div
        className={`
          inline-flex items-center justify-center
          ${sizeConfig.container}
          ${info.theme.bg}
          ${info.theme.text}
          border ${info.theme.border}
          rounded-full
          font-medium
          backdrop-blur-sm
          shadow-lg
          transition-all duration-300
        `}
      >
        {/* Icon with shimmer animation */}
        <motion.div
          variants={animated ? shimmerVariants : undefined}
          initial={animated ? 'initial' : undefined}
          animate={animated ? 'animate' : undefined}
        >
          <Icon size={sizeConfig.icon} strokeWidth={2.5} />
        </motion.div>

        {/* Program Name */}
        <span className="font-semibold tracking-wide">
          {info.displayName}
        </span>

        {/* Sparkle effect */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full opacity-0"
            animate={{
              opacity: [0, 0.2, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: `radial-gradient(circle, ${
                program === 'VIRTUOSO' ? '#fbbf24' : '#e2e8f0'
              } 0%, transparent 70%)`,
            }}
          />
        )}
      </div>

      {/* Optional Description */}
      {showDescription && (
        <motion.p
          className="text-xs text-slate-600 dark:text-slate-400 px-2"
          initial={animated ? { opacity: 0, y: -5 } : undefined}
          animate={animated ? { opacity: 1, y: 0 } : undefined}
          transition={animated ? { delay: 0.1 } : undefined}
        >
          {info.description}
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * Luxury Badge Group Component
 *
 * Displays multiple luxury badges for a hotel
 *
 * @example
 * ```tsx
 * <LuxuryBadgeGroup programs={['VIRTUOSO', 'FOUR_SEASONS_PREFERRED']} />
 * ```
 */
interface LuxuryBadgeGroupProps {
  programs: LuxuryProgram[];
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  maxVisible?: number;
}

export function LuxuryBadgeGroup({
  programs,
  showDescription = false,
  size = 'md',
  animated = true,
  maxVisible,
}: LuxuryBadgeGroupProps) {
  const visiblePrograms = maxVisible
    ? programs.slice(0, maxVisible)
    : programs;
  const hiddenCount = programs.length - visiblePrograms.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visiblePrograms.map((program, index) => (
        <motion.div
          key={program}
          initial={animated ? { opacity: 0, x: -10 } : undefined}
          animate={animated ? { opacity: 1, x: 0 } : undefined}
          transition={animated ? { delay: index * 0.1 } : undefined}
        >
          <LuxuryBadge
            program={program}
            showDescription={showDescription}
            size={size}
            animated={animated}
          />
        </motion.div>
      ))}

      {/* "+X more" indicator */}
      {hiddenCount > 0 && (
        <motion.div
          className={`
            ${SIZE_VARIANTS[size].container}
            bg-slate-100 text-slate-600
            dark:bg-slate-800 dark:text-slate-300
            rounded-full font-medium
          `}
          initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={
            animated
              ? { delay: visiblePrograms.length * 0.1 }
              : undefined
          }
        >
          +{hiddenCount} more
        </motion.div>
      )}
    </div>
  );
}

/**
 * Luxury Indicator Dot
 *
 * Minimal indicator for luxury status (for use in compact layouts)
 *
 * @example
 * ```tsx
 * <LuxuryIndicatorDot isLuxury={true} />
 * ```
 */
interface LuxuryIndicatorDotProps {
  isLuxury: boolean;
  animated?: boolean;
}

export function LuxuryIndicatorDot({
  isLuxury,
  animated = true,
}: LuxuryIndicatorDotProps) {
  if (!isLuxury) return null;

  return (
    <motion.div
      className="relative inline-flex items-center justify-center"
      initial={animated ? { scale: 0 } : undefined}
      animate={animated ? { scale: 1 } : undefined}
      transition={
        animated
          ? {
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }
          : undefined
      }
    >
      {/* Dot */}
      <div className="w-2 h-2 rounded-full bg-amber-400" />

      {/* Pulse animation */}
      {animated && (
        <motion.div
          className="absolute inset-0 rounded-full bg-amber-400"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  );
}
