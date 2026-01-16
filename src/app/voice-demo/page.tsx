"use client";

import { useState } from 'react';
import { VoiceAssistantLayout, type DemoState, type Resort } from '@/components/voice';

const SAMPLE_RESORTS: Resort[] = [
  {
    id: '1',
    name: 'Amanpuri',
    location: 'Phuket, Thailand',
    description: 'Iconic resort with pavilions nestled in a coconut palm grove overlooking the Andaman Sea.',
    pricePerNight: '$1,200',
    rating: 4.9,
    amenities: ['Private Beach', 'Spa', 'Fine Dining'],
  },
  {
    id: '2',
    name: 'Four Seasons Bora Bora',
    location: 'Bora Bora, French Polynesia',
    description: 'Overwater bungalows with glass floors and stunning views of Mount Otemanu.',
    pricePerNight: '$1,800',
    rating: 4.8,
    amenities: ['Overwater Villas', 'Snorkeling', 'Spa'],
  },
  {
    id: '3',
    name: 'Singita Sabi Sand',
    location: 'Kruger National Park, South Africa',
    description: 'Luxury safari lodge with incredible wildlife viewing and world-class service.',
    pricePerNight: '$2,500',
    rating: 5.0,
    amenities: ['Safari', 'Wine Cellar', 'Private Game Drives'],
  },
];

const DEMO_TRANSCRIPTS = {
  idle: '',
  listening: '',
  speaking: 'I found some wonderful beach resorts in Thailand for you. These properties offer stunning ocean views and world-class amenities.',
  searching: 'Let me search for the perfect accommodations...',
  results: 'Here are your results',
};

export default function VoiceDemoPage() {
  const [demoState, setDemoState] = useState<DemoState>('idle');

  // State toggle buttons for demo purposes
  const states: DemoState[] = ['idle', 'listening', 'speaking', 'searching', 'results'];

  return (
    <div className="relative">
      {/* Demo controls */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 p-1.5 bg-card/80 backdrop-blur-xl rounded-full border border-border/50 shadow-soft">
          {states.map((state) => (
            <button
              key={state}
              onClick={() => setDemoState(state)}
              className={`px-4 py-2 rounded-full text-xs font-light tracking-wide transition-all duration-300
                ${demoState === state
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
            >
              {state}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Assistant Layout */}
      <VoiceAssistantLayout
        state={demoState}
        transcript={DEMO_TRANSCRIPTS[demoState]}
        results={demoState === 'results' ? SAMPLE_RESORTS : []}
      />
    </div>
  );
}
