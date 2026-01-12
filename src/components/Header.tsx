'use client';

import Link from 'next/link';
import { Bell, Search } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white py-4 shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
          <Bell className="h-6 w-6 text-[#D9A021] fill-[#D9A021]" />
          <span className="text-2xl font-bold text-[#1c5558]">Bell</span>
          <span className="text-2xl font-bold text-[#D9A021]">hopping</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-[#2C5F63] transition-colors uppercase tracking-wide"
          >
            HOME
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-[#2C5F63] transition-colors uppercase tracking-wide"
          >
            SEARCH
          </Link>
          <Link
            href="#dashboard"
            className="text-sm font-medium text-gray-700 hover:text-[#2C5F63] transition-colors uppercase tracking-wide"
          >
            DASHBOARD
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden md:inline-flex p-2 hover:bg-gray-100 rounded-md transition-colors">
            <Search className="h-4 w-4 text-gray-700" />
          </button>
          <button className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:border-gray-400 rounded-md transition-colors">
            Member Login
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-[#2C5F63] text-white hover:bg-[#2C5F63]/90 rounded-md transition-colors">
            Join The Club
          </button>
        </div>
      </div>
    </header>
  );
}
