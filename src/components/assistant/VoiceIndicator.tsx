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
      className="flex items-center gap-6 bg-white/80 backdrop-blur-xl px-8 py-4 rounded-full shadow-lg border border-slate-200/50"
    >
      {/* Microphone toggle */}
      <button
        onClick={onToggleMic}
        className={`
          relative p-5 rounded-full transition-all duration-300 shadow-md
          ${
            isMuted
              ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:shadow-lg'
              : isListening
              ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200'
              : 'bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-xl hover:scale-105'
          }
        `}
        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
      >
        {isMuted ? (
          <MicOff className="w-6 h-6" />
        ) : (
          <Mic className="w-6 h-6" />
        )}

        {/* Listening animation ring */}
        {isListening && !isMuted && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-300"
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
        className={`
          p-5 rounded-full transition-all duration-300 shadow-md
          ${
            isSpeakerOn
              ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-xl hover:scale-105'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:shadow-lg'
          }
        `}
        aria-label={isSpeakerOn ? 'Mute speaker' : 'Unmute speaker'}
      >
        {isSpeakerOn ? (
          <Volume2 className="w-6 h-6" />
        ) : (
          <VolumeX className="w-6 h-6" />
        )}
      </button>

      {/* Status text */}
      <motion.span
        key={isListening ? 'listening' : 'ready'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        className="text-sm text-slate-600 ml-2 font-medium tracking-wide"
      >
        {isMuted ? 'Microphone off' : isListening ? 'Listening...' : 'Ready'}
      </motion.span>
    </motion.div>
  );
}
