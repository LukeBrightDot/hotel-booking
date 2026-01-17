"use client";

import React, { useEffect, useState, useRef } from 'react';
import { splitTextIntoWords, staggerDelay } from '@/lib/animations';

interface AnimatedTranscriptProps {
  text: string;
  isActive?: boolean;
  className?: string;
  speed?: 'slow' | 'medium' | 'fast';
  debounceMs?: number;
}

export const AnimatedTranscript: React.FC<AnimatedTranscriptProps> = ({
  text,
  isActive = true,
  className = '',
  speed = 'medium',
  debounceMs = 300,
}) => {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const [debouncedText, setDebouncedText] = useState<string>('');
  const previousTextRef = useRef<string>('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const words = splitTextIntoWords(debouncedText);

  const speedMs = {
    slow: 150,
    medium: 80,
    fast: 40,
  };

  // Debounce the incoming text to prevent showing partial transcriptions
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only debounce if text is actually changing (streaming)
    // If text is empty, update immediately
    if (!text) {
      setDebouncedText('');
      return;
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedText(text);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [text, debounceMs]);

  useEffect(() => {
    if (!isActive) {
      setVisibleWords(0);
      return;
    }

    // Only reset if text actually changed
    if (debouncedText !== previousTextRef.current) {
      previousTextRef.current = debouncedText;
      setVisibleWords(0);
    }

    const interval = setInterval(() => {
      setVisibleWords(prev => {
        if (prev >= words.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs[speed]);

    return () => clearInterval(interval);
  }, [debouncedText, isActive, words.length, speed]);

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        letterSpacing: '0.025em',
        textAlign: 'center'
      }}
    >
      <p
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
          lineHeight: 1.6,
          color: 'hsl(30 20% 15% / 0.9)'
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              marginLeft: '0.25rem',
              marginRight: '0.25rem',
              transitionDelay: `${staggerDelay(index, 30)}ms`,
              opacity: index < visibleWords ? 1 : 0,
              transform: index < visibleWords ? 'translateY(0)' : 'translateY(0.5rem)',
              filter: index < visibleWords ? 'blur(0)' : 'blur(4px)',
              transition: 'all 500ms ease-out',
            }}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
};

interface StaticTranscriptProps {
  text: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'muted';
}

export const StaticTranscript: React.FC<StaticTranscriptProps> = ({
  text,
  className = '',
  variant = 'primary',
}) => {
  const variantColors = {
    primary: 'hsl(30 20% 15% / 0.9)',
    secondary: 'hsl(30 20% 15% / 0.7)',
    muted: 'hsl(30 15% 45%)',
  };

  return (
    <div
      className={className}
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontWeight: 300,
        letterSpacing: '0.025em',
        textAlign: 'center'
      }}
    >
      <p
        style={{
          fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
          lineHeight: 1.6,
          color: variantColors[variant]
        }}
      >
        {text}
      </p>
    </div>
  );
};

export default AnimatedTranscript;
