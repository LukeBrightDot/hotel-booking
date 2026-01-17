'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="py-4 bg-background">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Bell className="h-5 w-5 text-gold fill-gold" style={{ color: 'hsl(var(--gold))', fill: 'hsl(var(--gold))' }} />
          <span className="text-lg font-light tracking-wide text-foreground">Bell</span>
          <span className="text-lg font-light tracking-wide" style={{ color: 'hsl(var(--gold))' }}>hopping</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-elegant px-5 py-2 rounded-full border border-border text-muted-foreground
                       hover:border-primary/50 hover:text-foreground transition-all duration-300"
          >
            Login
          </Link>
          <Link
            href="/join"
            className="text-elegant px-5 py-2 rounded-full bg-accent text-accent-foreground
                       hover:shadow-lg transition-all duration-300"
            style={{ boxShadow: '0 2px 8px hsl(var(--accent) / 0.25)' }}
          >
            Join
          </Link>
        </nav>
      </div>
    </header>
  );
}
