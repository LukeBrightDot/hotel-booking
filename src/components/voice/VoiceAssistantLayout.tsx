"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, LogIn, UserPlus } from 'lucide-react';
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
      {/* Header */}
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.5rem',
          background: 'hsl(30 25% 98% / 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '9999px',
              background: 'linear-gradient(135deg, hsl(15 55% 70%), hsl(35 45% 75%))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'hsl(30 25% 98%)', fontWeight: 600, fontSize: '0.875rem' }}>V</span>
          </div>
          <span style={{ fontSize: '1.125rem', letterSpacing: '0.05em', color: 'hsl(30 20% 15%)' }}>Voyage</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: 'hsl(30 15% 45%)',
              background: 'transparent',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <LogIn style={{ width: '1rem', height: '1rem' }} />
            Login
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: 'hsl(30 25% 98%)',
              background: 'hsl(15 55% 70%)',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
          >
            <UserPlus style={{ width: '1rem', height: '1rem' }} />
            Join
          </button>
        </div>
      </header>

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
          flex: isCompact ? 'none' : 1,
          justifyContent: isCompact ? 'flex-start' : 'center',
        }}
      >
        <div style={{ marginBottom: '1.5rem', transition: 'all 500ms' }}>
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
            transition: 'all 700ms ease-out',
            transform: isCompact ? 'scale(0.75)' : 'scale(1)',
            marginBottom: isCompact ? '-2rem' : 0,
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

        <div
          style={{
            maxWidth: '42rem',
            width: '100%',
            minHeight: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 500ms',
            marginTop: isCompact ? 0 : '2rem',
            marginBottom: isCompact ? '1.5rem' : '3rem',
          }}
        >
          {transcript && (
            <AnimatedTranscript
              text={transcript}
              isActive={state === 'speaking'}
              speed="medium"
            />
          )}
        </div>
      </div>

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
        style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 200,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            fontSize: '0.75rem',
            color: 'hsl(30 15% 45% / 0.4)',
          }}
        >
          Voyage AI
        </span>
      </div>
    </div>
  );
};

export default VoiceAssistantLayout;
