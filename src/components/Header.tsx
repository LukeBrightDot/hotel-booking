'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4" style={{ background: 'hsl(30 25% 98%)' }}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Bell className="h-5 w-5" style={{ color: 'hsl(40 45% 55%)', fill: 'hsl(40 45% 55%)' }} />
          <span className="text-lg font-light tracking-wide" style={{ color: 'hsl(30 15% 25%)' }}>Bell</span>
          <span className="text-lg font-light tracking-wide" style={{ color: 'hsl(40 45% 55%)' }}>hopping</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/assistant"
            className="px-5 py-2 text-xs font-light tracking-[0.1em] uppercase rounded-full transition-all duration-300"
            style={{
              background: 'hsl(15 45% 65%)',
              color: 'white',
              boxShadow: '0 2px 8px hsl(15 45% 65% / 0.3)',
            }}
          >
            AI Assistant
          </Link>
          <button
            className="px-5 py-2 text-xs font-light tracking-[0.1em] uppercase rounded-full transition-all duration-300 hover:bg-opacity-80"
            style={{
              background: 'transparent',
              color: 'hsl(30 10% 50%)',
              border: '1px solid hsl(30 20% 85%)',
            }}
          >
            Login
          </button>
          <button
            className="px-5 py-2 text-xs font-light tracking-[0.1em] uppercase rounded-full transition-all duration-300"
            style={{
              background: 'hsl(35 50% 75%)',
              color: 'white',
              boxShadow: '0 2px 8px hsl(35 50% 75% / 0.3)',
            }}
          >
            Join
          </button>
        </div>
      </div>
    </header>
  );
}
