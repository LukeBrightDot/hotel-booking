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
      className="flex items-center gap-6"
    >
      {/* Microphone toggle */}
      <button
        onClick={onToggleMic}
        className={`
          relative p-4 rounded-full transition-all duration-300
          ${
            isMuted
              ? 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              : isListening
              ? 'bg-amber-50 text-amber-600'
              : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
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
            className="absolute inset-0 rounded-full border-2 border-amber-400"
            animate={{
              scale: [1, 1.3, 1],
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
          p-4 rounded-full transition-all duration-300
          ${
            isSpeakerOn
              ? 'bg-teal-50 text-teal-600 hover:bg-teal-100'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
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
        animate={{ opacity: 0.6 }}
        className="text-sm text-gray-500 ml-2"
      >
        {isMuted ? 'Microphone off' : isListening ? 'Listening...' : 'Ready'}
      </motion.span>
    </motion.div>
  );
}
