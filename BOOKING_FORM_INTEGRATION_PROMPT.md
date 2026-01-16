# Hotel Booking Form - Next.js Integration Guide

## Overview

This guide provides step-by-step instructions to integrate a luxury hotel booking form UI into a Next.js application. The design uses a warm, elegant palette inspired by the "Her" movie aesthetic with inline styles for maximum portability.

**Key Features:**
- Voice/Search toggle that navigates between `/assistant` (voice) and current page (form)
- Complete booking form with destination, dates, rooms, and guests
- Warm luxury color palette with HSL colors
- All inline styles for maximum portability (no Tailwind dependency)

**Design System Colors (HSL format):**
- Background: `hsl(30 25% 98%)` - Warm off-white
- Primary/Accent: `hsl(15 55% 70%)` - Warm coral/terracotta
- Secondary: `hsl(35 45% 75%)` - Warm sand
- Text Primary: `hsl(30 20% 15%)` - Deep warm brown
- Text Secondary: `hsl(30 15% 45%)` - Muted warm gray
- Border: `hsl(30 15% 88%)` - Light warm gray
- Input Background: `hsl(30 20% 96%)` - Very light warm gray

---

## Phase 1: Install Dependencies

```bash
npm install lucide-react date-fns
# If using shadcn/ui for Calendar and Popover:
npx shadcn@latest add calendar popover
```

---

## Phase 2: Create SearchModeToggle Component (with Navigation)

**File: `components/booking/SearchModeToggle.tsx`**

This component navigates to `/assistant` when Voice is clicked, or stays on current page for Search.

```tsx
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
      router.push('/'); // or '/booking' depending on your route structure
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
```

---

## Phase 3: Create Header Component

**File: `components/booking/Header.tsx`**

Reusable header with logo, navigation toggle, and auth buttons.

```tsx
'use client';

import React from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { SearchModeToggle } from './SearchModeToggle';

interface HeaderProps {
  showModeToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showModeToggle = true }) => {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          background: 'linear-gradient(135deg, hsl(15 55% 70%), hsl(35 45% 75%))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ 
            color: 'hsl(30 25% 98%)', 
            fontWeight: 600, 
            fontSize: '0.875rem' 
          }}>V</span>
        </div>
        <span style={{ 
          fontSize: '1.125rem', 
          letterSpacing: '0.05em', 
          color: 'hsl(30 20% 15%)',
          fontFamily: '"Inter", system-ui, sans-serif',
        }}>Voyage</span>
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
```

---

## Phase 4: Create BookingForm Component

**File: `components/booking/BookingForm.tsx`**

```tsx
'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Home, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface BookingFormProps {
  onSearch?: (data: BookingData) => void;
  className?: string;
}

export interface BookingData {
  destination: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  rooms: number;
  guests: number;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onSearch, className = '' }) => {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

  const handleSearch = () => {
    onSearch?.({
      destination,
      checkIn,
      checkOut,
      rooms,
      guests,
    });
  };

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowRoomsDropdown(false);
    setShowGuestsDropdown(false);
  };

  const inputContainerStyle: React.CSSProperties = {
    background: 'hsl(30 20% 96%)',
    border: '1px solid hsl(30 15% 88%)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'hsl(30 15% 45%)',
    marginBottom: '4px',
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    color: 'hsl(30 20% 15%)',
  };

  const placeholderStyle: React.CSSProperties = {
    ...valueStyle,
    color: 'hsl(30 15% 60%)',
  };

  const iconStyle: React.CSSProperties = {
    width: '18px',
    height: '18px',
    color: 'hsl(15 55% 70%)',
    flexShrink: 0,
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    left: 0,
    right: 0,
    background: 'hsl(30 25% 98%)',
    border: '1px solid hsl(30 15% 88%)',
    borderRadius: '10px',
    padding: '6px',
    zIndex: 50,
    boxShadow: '0 4px 16px hsl(30 20% 15% / 0.1)',
  };

  const dropdownItemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: '"Inter", system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    color: 'hsl(30 20% 15%)',
    background: isSelected ? 'hsl(15 55% 70% / 0.15)' : 'transparent',
    transition: 'background 0.2s ease',
  });

  return (
    <div className={className} style={{ width: '100%', maxWidth: '800px' }}>
      {/* Main Form Card */}
      <div style={{
        background: 'hsl(30 25% 98%)',
        border: '1px solid hsl(30 15% 90%)',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 8px 32px hsl(30 20% 15% / 0.08)',
      }}>
        {/* Form Title */}
        <h2 style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: '22px',
          fontWeight: 300,
          letterSpacing: '0.02em',
          color: 'hsl(30 20% 15%)',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          Find Your Perfect Stay
        </h2>

        {/* Form Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          marginBottom: '20px',
        }}>
          {/* Destination Input - spans 2 columns */}
          <div style={{ gridColumn: 'span 2' }}>
            <div 
              style={inputContainerStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <MapPin style={iconStyle} />
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Destination</div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="City or hotel name"
                  style={{
                    ...valueStyle,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    padding: 0,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Check In Date */}
          <Popover>
            <PopoverTrigger asChild>
              <div 
                style={inputContainerStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                  e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Calendar style={iconStyle} />
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>Check In</div>
                  <div style={checkIn ? valueStyle : placeholderStyle}>
                    {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0" 
              align="start"
              style={{
                background: 'hsl(30 25% 98%)',
                border: '1px solid hsl(30 15% 88%)',
                borderRadius: '12px',
              }}
            >
              <CalendarComponent
                mode="single"
                selected={checkIn}
                onSelect={setCheckIn}
                disabled={(date) => date < new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Check Out Date */}
          <Popover>
            <PopoverTrigger asChild>
              <div 
                style={inputContainerStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                  e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Calendar style={iconStyle} />
                <div style={{ flex: 1 }}>
                  <div style={labelStyle}>Check Out</div>
                  <div style={checkOut ? valueStyle : placeholderStyle}>
                    {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
                  </div>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent 
              className="w-auto p-0" 
              align="start"
              style={{
                background: 'hsl(30 25% 98%)',
                border: '1px solid hsl(30 15% 88%)',
                borderRadius: '12px',
              }}
            >
              <CalendarComponent
                mode="single"
                selected={checkOut}
                onSelect={setCheckOut}
                disabled={(date) => date < (checkIn || new Date())}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          {/* Rooms Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              style={inputContainerStyle}
              onClick={() => {
                setShowRoomsDropdown(!showRoomsDropdown);
                setShowGuestsDropdown(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Home style={iconStyle} />
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Rooms</div>
                <div style={valueStyle}>{rooms} {rooms === 1 ? 'Room' : 'Rooms'}</div>
              </div>
              <ChevronDown style={{ ...iconStyle, color: 'hsl(30 15% 60%)' }} />
            </div>
            
            {showRoomsDropdown && (
              <div style={dropdownStyle}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    onClick={() => {
                      setRooms(num);
                      setShowRoomsDropdown(false);
                    }}
                    style={dropdownItemStyle(rooms === num)}
                    onMouseEnter={(e) => {
                      if (rooms !== num) {
                        e.currentTarget.style.background = 'hsl(30 20% 94%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = rooms === num 
                        ? 'hsl(15 55% 70% / 0.15)' 
                        : 'transparent';
                    }}
                  >
                    {num} {num === 1 ? 'Room' : 'Rooms'}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guests Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              style={inputContainerStyle}
              onClick={() => {
                setShowGuestsDropdown(!showGuestsDropdown);
                setShowRoomsDropdown(false);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Users style={iconStyle} />
              <div style={{ flex: 1 }}>
                <div style={labelStyle}>Guests</div>
                <div style={valueStyle}>{guests} {guests === 1 ? 'Guest' : 'Guests'}</div>
              </div>
              <ChevronDown style={{ ...iconStyle, color: 'hsl(30 15% 60%)' }} />
            </div>
            
            {showGuestsDropdown && (
              <div style={dropdownStyle}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <div
                    key={num}
                    onClick={() => {
                      setGuests(num);
                      setShowGuestsDropdown(false);
                    }}
                    style={dropdownItemStyle(guests === num)}
                    onMouseEnter={(e) => {
                      if (guests !== num) {
                        e.currentTarget.style.background = 'hsl(30 20% 94%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = guests === num 
                        ? 'hsl(15 55% 70% / 0.15)' 
                        : 'transparent';
                    }}
                  >
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          style={{
            width: '100%',
            padding: '16px 28px',
            background: 'linear-gradient(135deg, hsl(15 55% 70%) 0%, hsl(25 50% 65%) 100%)',
            border: 'none',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 16px hsl(15 55% 70% / 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 24px hsl(15 55% 70% / 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px hsl(15 55% 70% / 0.3)';
          }}
        >
          <Search style={{ width: '18px', height: '18px', color: 'hsl(30 25% 98%)' }} />
          <span style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase' as const,
            color: 'hsl(30 25% 98%)',
          }}>
            Search Hotels
          </span>
        </button>
      </div>
    </div>
  );
};

export default BookingForm;
```

---

## Phase 5: Create Exports

**File: `components/booking/index.ts`**

```ts
export { BookingForm } from './BookingForm';
export type { BookingData } from './BookingForm';
export { SearchModeToggle, type SearchMode } from './SearchModeToggle';
export { Header } from './Header';
```

---

## Phase 6: Create Booking Page

**File: `app/page.tsx` (or `app/booking/page.tsx`)**

This is the main booking form page. When user clicks "Voice" in the toggle, it navigates to `/assistant`.

```tsx
'use client';

import React from 'react';
import { BookingForm, type BookingData, Header } from '@/components/booking';

export default function BookingPage() {
  const handleFormSearch = (data: BookingData) => {
    console.log('Search data:', data);
    // Navigate to results page or call search API
    // router.push(`/results?destination=${data.destination}&...`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(30 25% 98%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '5rem 1.5rem 0',
    }}>
      {/* Header with Voice/Search toggle */}
      <Header showModeToggle={true} />

      {/* Main content area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '56rem',
        transition: 'all 500ms ease-out',
      }}>
        <BookingForm onSearch={handleFormSearch} />
      </main>

      {/* Subtle branding */}
      <div style={{ 
        position: 'absolute', 
        bottom: '1.5rem', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }}>
        <span style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 200,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          color: 'hsl(30 15% 45% / 0.4)',
        }}>
          Voyage AI
        </span>
      </div>
    </div>
  );
}
```

---

## Phase 7: Update Assistant Page Header

On your existing `/assistant` page, add the same Header component so the Voice/Search toggle appears there too:

**Update: `app/assistant/page.tsx`**

```tsx
// At the top of your existing assistant page, add:
import { Header } from '@/components/booking';

// Then in your component's return, add the Header:
export default function AssistantPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'hsl(30 25% 98%)',
      // ... your existing styles
    }}>
      {/* Add this Header - Voice will be highlighted since we're on /assistant */}
      <Header showModeToggle={true} />
      
      {/* Rest of your existing assistant UI */}
      {/* ... */}
    </div>
  );
}
```

---

## Phase 8: Calendar Styling (Critical)

Add these styles to your `globals.css` for consistent calendar theming:

```css
/* Calendar warm theme overrides */
.rdp {
  --rdp-cell-size: 40px;
  --rdp-accent-color: hsl(15 55% 70%);
  --rdp-background-color: hsl(15 55% 70% / 0.15);
}

.rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
  background-color: hsl(30 20% 94%);
}

.rdp-day_selected,
.rdp-day_selected:hover {
  background-color: hsl(15 55% 70%);
  color: hsl(30 25% 98%);
}

.rdp-day_today:not(.rdp-day_selected) {
  border: 1px solid hsl(15 55% 70%);
}

/* Ensure calendar text uses the warm palette */
.rdp-caption_label {
  color: hsl(30 20% 15%);
  font-family: "Inter", system-ui, sans-serif;
}

.rdp-head_cell {
  color: hsl(30 15% 45%);
  font-family: "Inter", system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
}

.rdp-day {
  color: hsl(30 20% 25%);
  font-family: "Inter", system-ui, sans-serif;
}

.rdp-day_disabled {
  color: hsl(30 15% 75%);
}
```

---

## Verification Checklist

### Header Component
- [ ] Logo displays with gradient background (coral to sand)
- [ ] "Voyage" text next to logo
- [ ] Voice/Search toggle centered in header
- [ ] Toggle correctly highlights based on current route (`/assistant` = Voice, else = Search)
- [ ] Clicking Voice navigates to `/assistant`
- [ ] Clicking Search navigates to `/` (or your booking route)
- [ ] Login button (transparent background)
- [ ] Join button (coral background)
- [ ] Header has blur backdrop effect

### Booking Form
- [ ] Card has warm off-white background with subtle border
- [ ] "Find Your Perfect Stay" title centered
- [ ] Destination input spans 2 columns
- [ ] All inputs have coral icons
- [ ] Hover effect on inputs (coral border + subtle glow)
- [ ] Check In calendar opens and disables past dates
- [ ] Check Out calendar opens and disables dates before Check In
- [ ] Rooms dropdown shows 1-5 options
- [ ] Guests dropdown shows 1-8 options
- [ ] Dropdowns close on selection
- [ ] Selected dropdown item highlighted with coral tint
- [ ] Search button has coral gradient
- [ ] Search button lifts on hover

### Colors Used (verify consistency)
- [ ] `hsl(30 25% 98%)` - Page background, form card
- [ ] `hsl(15 55% 70%)` - Primary accent (icons, button, hover borders)
- [ ] `hsl(35 45% 75%)` - Secondary (logo gradient)
- [ ] `hsl(30 20% 15%)` - Primary text
- [ ] `hsl(30 15% 45%)` - Secondary text (labels)
- [ ] `hsl(30 15% 88%)` - Borders
- [ ] `hsl(30 20% 96%)` - Input backgrounds

---

## File Structure

```
components/
  booking/
    BookingForm.tsx       # Main form component
    SearchModeToggle.tsx  # Voice/Search toggle with navigation
    Header.tsx            # Shared header component
    index.ts              # Exports
app/
  page.tsx                # Booking form page (Search mode)
  assistant/
    page.tsx              # Voice assistant page (Voice mode)
```

---

## Common Issues & Solutions

### Issue: Calendar not clickable in popover
**Solution:** Add `pointer-events-auto` to Calendar className:
```tsx
<CalendarComponent className="p-3 pointer-events-auto" />
```

### Issue: Dropdowns appearing behind other elements
**Solution:** Ensure dropdown has `zIndex: 50` in styles

### Issue: Navigation not working
**Solution:** Ensure you're using Next.js App Router (`next/navigation`) not Pages Router (`next/router`)

### Issue: Fonts not loading
**Solution:** Add Inter font in `layout.tsx`:
```tsx
import { Inter } from 'next/font/google';
const inter = Inter({ subsets: ['latin'] });
// Apply to body: <body className={inter.className}>
```

### Issue: Backdrop blur not working
**Solution:** Both `backdropFilter` and `WebkitBackdropFilter` are included for cross-browser support

### Issue: Hover effects feel wrong
**Solution:** Verify transition timing is `0.3s ease` and colors match the palette

---

## Integration with Existing Voice Assistant

If your `/assistant` page already has a header, you have two options:

**Option A:** Replace your existing header with the shared `Header` component

**Option B:** Just add the `SearchModeToggle` component to your existing header:
```tsx
import { SearchModeToggle } from '@/components/booking';

// In your existing header JSX:
<SearchModeToggle />
```

---

## Notes

- All styles use inline `React.CSSProperties` for maximum portability
- No Tailwind CSS dependency (works in any React/Next.js project)
- HSL colors used consistently throughout
- The toggle auto-detects current page via `usePathname()`
- Hover effects use JavaScript event handlers
- Calendar requires shadcn/ui Popover and Calendar components
