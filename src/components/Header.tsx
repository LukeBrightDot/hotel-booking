'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Bell className="h-6 w-6 text-[#D9A021] fill-[#D9A021]" />
          <span className="text-xl font-semibold text-[#1c5558]">Bell</span>
          <span className="text-xl font-semibold text-[#D9A021]">hopping</span>
        </Link>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-400 rounded transition-colors">
            Member Login
          </button>
          <button className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-400 rounded transition-colors">
            Join The Club
          </button>
        </div>
      </div>
    </header>
  );
}
