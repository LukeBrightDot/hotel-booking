'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

interface TranscriptDisplayProps {
  messages: Message[];
  currentTranscript?: string;
  isListening?: boolean;
}

export function TranscriptDisplay({
  messages,
  currentTranscript,
  isListening,
}: TranscriptDisplayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const lastMessage = messages[messages.length - 1];

  // Typewriter effect for assistant messages
  useEffect(() => {
    if (lastMessage?.role === 'assistant') {
      setIsTyping(true);
      setDisplayedText('');

      const text = lastMessage.content;
      let index = 0;

      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 30); // 30ms per character for natural feel

      return () => clearInterval(interval);
    }
  }, [lastMessage?.id, lastMessage?.content, lastMessage?.role]);

  return (
    <div className="w-full max-w-3xl mx-auto px-8">
      <AnimatePresence mode="wait">
        {/* Current assistant message with typewriter */}
        {lastMessage?.role === 'assistant' && (
          <motion.div
            key={lastMessage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="text-center"
          >
            <p className="text-2xl md:text-3xl font-light text-slate-800 leading-relaxed tracking-tight antialiased">
              {isTyping ? displayedText : lastMessage.content}
              {isTyping && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-8 bg-slate-400 ml-1 align-middle"
                />
              )}
            </p>
          </motion.div>
        )}

        {/* User's current speech transcript */}
        {isListening && currentTranscript && (
          <motion.div
            key="transcript"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8"
          >
            <p className="text-xl text-slate-500 italic font-light tracking-wide">
              &ldquo;{currentTranscript}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Listening indicator when no transcript yet */}
        {isListening && !currentTranscript && (
          <motion.div
            key="listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-8"
          >
            <p className="text-lg text-slate-400 font-light tracking-wide">Listening...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Previous messages (faded, scrollable if needed) */}
      {messages.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="mt-12 space-y-4 max-h-32 overflow-y-auto"
        >
          {messages.slice(0, -1).map((msg) => (
            <p
              key={msg.id}
              className={`text-sm ${
                msg.role === 'user' ? 'text-gray-400 italic' : 'text-gray-500'
              }`}
            >
              {msg.role === 'user' ? `"${msg.content}"` : msg.content}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  );
}
