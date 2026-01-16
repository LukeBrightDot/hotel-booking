"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Header } from '@/components/booking';
import { ParticleVisualization } from './ParticleVisualization';
import { AnimatedTranscript } from './AnimatedTranscript';
import { FloatingLocations } from './FloatingLocations';
import { ResortCard, type Resort } from './ResortCard';
import { type VoiceActivityLevel } from '@/lib/animations';

export type DemoState = 'idle' | 'listening' | 'speaking' | 'searching' | 'results';

interface VoiceAssistantLayoutProps {
  state: DemoState;
  transcript: string;
  results?: Resort[];
  className?: string;
  onMicToggle?: () => void;
  onSpeakerToggle?: () => void;
  isMicMuted?: boolean;
  isSpeakerMuted?: boolean;
  onResortSelect?: (resort: Resort) => void;
}

export const VoiceAssistantLayout: React.FC<VoiceAssistantLayoutProps> = ({
  state,
  transcript,
  results = [],
  className = '',
  onMicToggle,
  onSpeakerToggle,
  isMicMuted: isMicMutedProp,
  isSpeakerMuted: isSpeakerMutedProp,
  onResortSelect,
}) => {
  const router = useRouter();
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [visibleResultCount, setVisibleResultCount] = useState(0);
  const prevStateRef = useRef<DemoState>(state);
  const animationRef = useRef<number>(0);

  // Use local state if props not provided (for demo mode)
  const [localMicMuted, setLocalMicMuted] = useState(false);
  const [localSpeakerMuted, setLocalSpeakerMuted] = useState(false);

  const isMicMuted = isMicMutedProp !== undefined ? isMicMutedProp : localMicMuted;
  const isSpeakerMuted = isSpeakerMutedProp !== undefined ? isSpeakerMutedProp : localSpeakerMuted;

  useEffect(() => {
    if (state === 'speaking' || state === 'listening') {
      const interval = setInterval(() => {
        const baseWave = Math.sin(Date.now() * 0.008) * 0.3;
        const quickWave = Math.sin(Date.now() * 0.02) * 0.2;
        const noise = (Math.random() - 0.5) * 0.3;
        setVoiceIntensity(Math.max(0, Math.min(1, 0.4 + baseWave + quickWave + noise)));
      }, 50);

      return () => clearInterval(interval);
    } else {
      const fadeOut = () => {
        setVoiceIntensity(prev => {
          if (prev <= 0.01) return 0;
          return prev * 0.9;
        });
        if (voiceIntensity > 0.01) {
          animationRef.current = requestAnimationFrame(fadeOut);
        }
      };
      fadeOut();

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [state]);

  useEffect(() => {
    if (state === 'results' && results.length > 0) {
      if (prevStateRef.current !== 'results') {
        setShowResults(false);
        setVisibleResultCount(0);

        setTimeout(() => {
          setShowResults(true);

          results.forEach((_, index) => {
            setTimeout(() => {
              setVisibleResultCount(prev => prev + 1);
            }, index * 200);
          });
        }, 300);
      } else {
        setShowResults(true);
        setVisibleResultCount(results.length);
      }
    } else {
      setShowResults(false);
      setVisibleResultCount(0);
    }

    prevStateRef.current = state;
  }, [state, results]);

  const getActivity = (): VoiceActivityLevel => {
    switch (state) {
      case 'idle': return 'idle';
      case 'listening': return 'listening';
      case 'speaking': return 'speaking';
      case 'searching': return 'processing';
      case 'results': return 'idle';
      default: return 'idle';
    }
  };

  const isCompact = state === 'results' && showResults;

  const handleMicToggle = () => {
    if (onMicToggle) {
      onMicToggle();
    } else {
      setLocalMicMuted(!localMicMuted);
    }
  };

  const handleSpeakerToggle = () => {
    if (onSpeakerToggle) {
      onSpeakerToggle();
    } else {
      setLocalSpeakerMuted(!localSpeakerMuted);
    }
  };

  return (
    <div
      className={className}
      style={{
        minHeight: '100vh',
        background: 'hsl(30 25% 98%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '5rem 1.5rem 0',
      }}
    >
      {/* Header with SearchModeToggle */}
      <Header showModeToggle={true} />

      {/* Audio controls */}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50, display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={handleMicToggle}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms',
            boxShadow: '0 4px 12px hsl(30 20% 15% / 0.1)',
            border: isMicMuted ? '1px solid hsl(0 70% 50% / 0.3)' : '1px solid hsl(30 15% 88%)',
            background: isMicMuted ? 'hsl(0 70% 50% / 0.2)' : 'hsl(30 20% 96%)',
            color: isMicMuted ? 'hsl(0 70% 50%)' : 'hsl(15 55% 70%)',
            cursor: 'pointer',
          }}
          aria-label={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMicMuted ? <MicOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Mic style={{ width: '1.25rem', height: '1.25rem' }} />}
        </button>
        <button
          onClick={handleSpeakerToggle}
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms',
            boxShadow: '0 4px 12px hsl(30 20% 15% / 0.1)',
            border: isSpeakerMuted ? '1px solid hsl(0 70% 50% / 0.3)' : '1px solid hsl(30 15% 88%)',
            background: isSpeakerMuted ? 'hsl(0 70% 50% / 0.2)' : 'hsl(30 20% 96%)',
            color: isSpeakerMuted ? 'hsl(0 70% 50%)' : 'hsl(15 55% 70%)',
            cursor: 'pointer',
          }}
          aria-label={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
        >
          {isSpeakerMuted ? <VolumeX style={{ width: '1.25rem', height: '1.25rem' }} /> : <Volume2 style={{ width: '1.25rem', height: '1.25rem' }} />}
        </button>
      </div>

      {/* Main visualization area */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '56rem',
          transition: 'all 700ms ease-out',
          paddingTop: '2rem',
          marginBottom: isCompact ? '2rem' : '4rem',
        }}
      >
        <div style={{
          marginBottom: '1.5rem',
          transition: 'all 500ms',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 200,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              color: 'hsl(30 15% 45%)',
              animation: state === 'searching' ? 'pulse 1s infinite' : 'pulseSoft 4s ease-in-out infinite',
            }}
          >
            {state === 'idle' && 'Ready'}
            {state === 'listening' && 'Listening...'}
            {state === 'speaking' && 'Speaking'}
            {state === 'searching' && 'Searching'}
            {state === 'results' && 'Found for you'}
          </span>
        </div>

        <div
          style={{
            position: 'relative',
            height: '350px',
            width: '350px',
            transition: 'all 700ms ease-out',
            transform: isCompact ? 'scale(0.75)' : 'scale(1)',
            marginBottom: isCompact ? '-2rem' : 0,
            zIndex: 1,
          }}
        >
          <ParticleVisualization
            activity={getActivity()}
            voiceIntensity={voiceIntensity}
            size={350}
          />

          <FloatingLocations
            isActive={state === 'searching'}
            radius={220}
          />
        </div>

      </div>

      {/* Floating transcript - appears on top of results when in results mode */}
      {transcript && (
        <div
          style={{
            position: isCompact ? 'fixed' : 'relative',
            top: isCompact ? '140px' : 'auto',
            left: isCompact ? '50%' : 'auto',
            transform: isCompact ? 'translateX(-50%)' : 'none',
            maxWidth: '42rem',
            width: '100%',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 700ms ease-out',
            marginTop: isCompact ? 0 : '2rem',
            marginBottom: isCompact ? 0 : '3rem',
            zIndex: 10,
            padding: '0 1rem',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            background: isCompact ? 'hsl(30 25% 98% / 0.95)' : 'transparent',
            backdropFilter: isCompact ? 'blur(12px)' : 'none',
            WebkitBackdropFilter: isCompact ? 'blur(12px)' : 'none',
            padding: isCompact ? '1.5rem 2rem' : '0',
            borderRadius: isCompact ? '16px' : '0',
            border: isCompact ? '1px solid hsl(30 15% 88% / 0.5)' : 'none',
            boxShadow: isCompact ? '0 8px 32px hsl(30 20% 15% / 0.12)' : 'none',
          }}>
            <AnimatedTranscript
              text={transcript}
              isActive={true}
              speed="medium"
              debounceMs={400}
            />
          </div>
        </div>
      )}

      {/* Results grid */}
      <div
        style={{
          width: '100%',
          maxWidth: '72rem',
          padding: '0 1rem 4rem',
          transition: 'all 700ms ease-out',
          opacity: showResults ? 1 : 0,
          transform: showResults ? 'translateY(0)' : 'translateY(2rem)',
          pointerEvents: showResults ? 'auto' : 'none',
        }}
      >
        {state === 'results' && results.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {results.slice(0, visibleResultCount).map((resort, index) => (
              <div
                key={resort.id}
                style={{
                  animation: 'fadeRise 0.8s ease-out forwards',
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                }}
              >
                <ResortCard
                  resort={resort}
                  index={index}
                  onClick={onResortSelect ? () => onResortSelect(resort) : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Branding */}
      <div
        onClick={() => router.push('/')}
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          opacity: 0.4,
          cursor: 'pointer',
          transition: 'opacity 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.4';
        }}
      >
        <img
          src="https://bellhopping.com/wp-content/uploads/2024/07/Bellhopping-Logo.svg"
          alt="Bellhopping"
          style={{
            height: '1.5rem',
            width: 'auto',
          }}
        />
      </div>
    </div>
  );
};

export default VoiceAssistantLayout;
