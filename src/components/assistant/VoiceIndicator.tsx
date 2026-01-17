'use client';

import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface VoiceIndicatorProps {
  isListening: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  showControls: boolean;
}

export function VoiceIndicator({
  isListening,
  isMuted,
  isSpeakerOn,
  onToggleMic,
  onToggleSpeaker,
  showControls,
}: VoiceIndicatorProps) {
  if (!showControls) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="flex items-center gap-3 px-4 py-3 rounded-full border shadow-sm"
      style={{
        background: 'hsl(30 20% 96% / 0.8)',
        backdropFilter: 'blur(12px)',
        borderColor: 'hsl(30 20% 88% / 0.5)',
      }}
    >
      {/* Microphone toggle */}
      <button
        onClick={onToggleMic}
        className="relative p-4 rounded-full transition-all duration-300"
        style={{
          background: isMuted
            ? 'hsl(30 15% 90%)'
            : isListening
            ? 'hsl(15 45% 65%)'
            : 'hsl(35 50% 75%)',
          color: isMuted ? 'hsl(30 10% 50%)' : 'white',
          boxShadow: isMuted ? 'none' : '0 4px 12px hsl(15 45% 65% / 0.3)',
        }}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {/* Listening animation ring */}
        {isListening && !isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ border: '2px solid hsl(15 45% 75%)' }}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.8, 0, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </button>

      {/* Speaker toggle */}
      <button
        onClick={onToggleSpeaker}
        className="p-4 rounded-full transition-all duration-300"
        style={{
          background: isSpeakerOn ? 'hsl(35 50% 75%)' : 'hsl(30 15% 90%)',
          color: isSpeakerOn ? 'white' : 'hsl(30 10% 50%)',
          boxShadow: isSpeakerOn ? '0 4px 12px hsl(35 50% 75% / 0.3)' : 'none',
        }}
        aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
      >
        {isSpeakerOn ? (
          <Volume2 className="w-5 h-5" />
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </button>

      {/* Status text */}
      <motion.span
        key={isListening ? 'listening' : 'ready'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        className="text-xs tracking-[0.15em] uppercase font-light ml-1"
        style={{ color: 'hsl(30 10% 50%)' }}
      >
        {isMuted ? 'Mic off' : isListening ? 'Listening...' : 'Ready'}
      </motion.span>
    </motion.div>
  );
}
