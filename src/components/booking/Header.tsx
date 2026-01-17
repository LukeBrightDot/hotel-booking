'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { SearchModeToggle } from './SearchModeToggle';

interface HeaderProps {
  showModeToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showModeToggle = true }) => {
  const router = useRouter();

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      background: 'hsl(30 25% 98% / 0.8)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      {/* Logo */}
      <div
        onClick={() => router.push('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
        }}
      >
        <img
          src="https://bellhopping.com/wp-content/uploads/2024/07/Bellhopping-Logo.svg"
          alt="Bellhopping"
          style={{
            height: '2rem',
            width: 'auto',
          }}
        />
      </div>

      {/* Center: Search Mode Toggle */}
      {showModeToggle && <SearchModeToggle />}

      {/* Auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontFamily: '"Inter", system-ui, sans-serif',
          color: 'hsl(30 15% 45%)',
          background: 'transparent',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'color 0.2s ease',
        }}>
          <LogIn style={{ width: '1rem', height: '1rem' }} />
          Login
        </button>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontFamily: '"Inter", system-ui, sans-serif',
          color: 'hsl(30 25% 98%)',
          background: 'hsl(15 55% 70%)',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}>
          <UserPlus style={{ width: '1rem', height: '1rem' }} />
          Join
        </button>
      </div>
    </header>
  );
};

export default Header;
