'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Mic, Search } from 'lucide-react';

export type SearchMode = 'voice' | 'form';

interface SearchModeToggleProps {
  className?: string;
}

export const SearchModeToggle: React.FC<SearchModeToggleProps> = ({ className = '' }) => {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current mode based on pathname
  const currentMode: SearchMode = pathname === '/assistant' ? 'voice' : 'form';

  const handleModeChange = (mode: SearchMode) => {
    if (mode === 'voice') {
      router.push('/assistant');
    } else {
      router.push('/');
    }
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '13px',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontWeight: 500,
    letterSpacing: '0.02em',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer',
    background: isActive ? 'hsl(30 25% 98%)' : 'transparent',
    color: isActive ? 'hsl(15 55% 70%)' : 'hsl(30 15% 55%)',
    boxShadow: isActive ? '0 2px 8px hsl(30 20% 15% / 0.08)' : 'none',
  });

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        background: 'hsl(30 20% 94%)',
        borderRadius: '14px',
        border: '1px solid hsl(30 15% 88%)',
      }}
    >
      <button
        onClick={() => handleModeChange('voice')}
        style={buttonStyle(currentMode === 'voice')}
      >
        <Mic style={{ width: '16px', height: '16px' }} />
        Voice
      </button>
      <button
        onClick={() => handleModeChange('form')}
        style={buttonStyle(currentMode === 'form')}
      >
        <Search style={{ width: '16px', height: '16px' }} />
        Search
      </button>
    </div>
  );
};

export default SearchModeToggle;
