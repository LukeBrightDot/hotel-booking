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
      <p className="text-2xl md:text-3xl leading-relaxed font-light tracking-wide"
         style={{
           fontFamily: "'Cormorant Garamond', Georgia, serif",
           color: 'hsl(30 15% 25%)',
         }}>
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className={`inline-block mx-1 transition-all duration-400 ${
              index < visibleWords
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
            style={{
              transitionDelay: `${staggerDelay(index, 20)}ms`,
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
