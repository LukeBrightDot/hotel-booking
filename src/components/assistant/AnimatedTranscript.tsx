'use client';

import React, { useEffect, useState, useRef } from 'react';
import { splitTextIntoWords, staggerDelay } from '@/lib/assistant/animations';

interface AnimatedTranscriptProps {
  text: string;
  isActive?: boolean;
  className?: string;
  speed?: 'slow' | 'medium' | 'fast';
}

export const AnimatedTranscript: React.FC<AnimatedTranscriptProps> = ({
  text,
  isActive = true,
  className = '',
  speed = 'medium',
}) => {
  const [visibleWords, setVisibleWords] = useState<number>(0);
  const prevTextRef = useRef<string>('');
  const words = splitTextIntoWords(text);

  const speedMs = {
    slow: 150,
    medium: 80,
    fast: 40,
  };

  useEffect(() => {
    // Reset animation when text changes
    if (text !== prevTextRef.current) {
      setVisibleWords(0);
      prevTextRef.current = text;
    }

    // Animate words appearing
    if (words.length > 0 && visibleWords < words.length) {
      const timer = setTimeout(() => {
        setVisibleWords(prev => prev + 1);
      }, speedMs[speed]);
      return () => clearTimeout(timer);
    }
  }, [text, visibleWords, words.length, speed]);

  if (!text) return null;

  return (
    <div className={`text-center ${className}`}>
      <p
        className="text-2xl md:text-3xl leading-relaxed"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          color: 'hsl(30 15% 25%)',
          fontWeight: 300,
        }}
      >
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              marginLeft: '0.25rem',
              marginRight: '0.25rem',
              transitionProperty: 'opacity, transform, filter',
              transitionDuration: '500ms',
              transitionTimingFunction: 'ease-out',
              transitionDelay: `${staggerDelay(index, 30)}ms`,
              opacity: index < visibleWords ? 1 : 0,
              transform: index < visibleWords ? 'translateY(0)' : 'translateY(8px)',
              filter: index < visibleWords ? 'blur(0)' : 'blur(4px)',
            }}
          >
            {word}
          </span>
        ))}
      </p>
    </div>
  );
};

export default AnimatedTranscript;
