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

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-5 py-2 rounded-full transition-all duration-300 hover:bg-opacity-90"
            style={{
              background: 'transparent',
              color: 'hsl(30 10% 45%)',
              border: '1px solid hsl(30 15% 80%)',
              fontSize: '0.7rem',
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            Login
          </Link>
          <Link
            href="/join"
            className="px-5 py-2 rounded-full transition-all duration-300 hover:shadow-lg"
            style={{
              background: 'hsl(35 50% 75%)',
              color: 'white',
              border: '1px solid hsl(35 50% 75%)',
              boxShadow: '0 2px 8px hsl(35 50% 75% / 0.25)',
              fontSize: '0.7rem',
              fontWeight: 300,
              letterSpacing: '0.1em',
              textTransform: 'uppercase' as const,
            }}
          >
            Join
          </Link>
        </div>
      </div>
    </header>
  );
}
