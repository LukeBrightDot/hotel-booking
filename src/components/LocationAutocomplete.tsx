'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { Location, LocationSearchResult } from '@/types/location';
import { Plane, MapPin, Building2, Loader2 } from 'lucide-react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'City or airport code',
  className = '',
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<LocationSearchResult>({
    airports: [],
    cities: [],
    hotels: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [justSelected, setJustSelected] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(value, 200);

  // Fetch autocomplete results
  useEffect(() => {
    if (debouncedValue.length >= 2 && !justSelected) {
      setIsLoading(true);
      fetch(`/api/locations/autocomplete?q=${encodeURIComponent(debouncedValue)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data);
          setIsOpen(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Autocomplete error:', err);
          setIsLoading(false);
        });
    } else {
      setResults({ airports: [], cities: [], hotels: [] });
      setIsOpen(false);
    }
  }, [debouncedValue, justSelected]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const allResults = [...results.airports, ...results.cities, ...results.hotels];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && allResults[selectedIndex]) {
        handleSelect(allResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (location: Location) => {
    onChange(location.name);
    onSelect(location);
    setIsOpen(false);
    setSelectedIndex(-1);
    setJustSelected(true);
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setJustSelected(false);
  };

  const handleFocus = () => {
    if (value.length >= 2 && !justSelected) {
      setIsOpen(true);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'airport':
        return <Plane style={{ width: '16px', height: '16px' }} />;
      case 'city':
        return <MapPin style={{ width: '16px', height: '16px' }} />;
      case 'hotel':
        return <Building2 style={{ width: '16px', height: '16px' }} />;
      default:
        return <MapPin style={{ width: '16px', height: '16px' }} />;
    }
  };

  const getLocationLabel = (location: Location) => {
    if (location.type === 'airport') {
      return `${location.name} (${location.code})`;
    }
    return location.state
      ? `${location.city}, ${location.state}, ${location.country}`
      : `${location.city}, ${location.country}`;
  };

  const hasResults = results.airports.length > 0 || results.cities.length > 0 || results.hotels.length > 0;
  let resultIndex = 0;

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: 'hsl(30 20% 15%)',
          }}
          className={className}
        />
        {isLoading && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
          }}>
            <Loader2 style={{ width: '16px', height: '16px', color: 'hsl(15 55% 70%)' }} className="animate-spin" />
          </div>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          zIndex: 50,
          width: '100%',
          marginTop: '8px',
          background: 'hsl(30 25% 98%)',
          border: '1px solid hsl(30 15% 88%)',
          borderRadius: '12px',
          boxShadow: '0 8px 24px hsl(30 20% 15% / 0.12)',
          maxHeight: '400px',
          overflowY: 'auto',
        }}>
          {!hasResults && debouncedValue.length >= 2 && !isLoading && (
            <div style={{
              padding: '12px 16px',
              textAlign: 'center',
              fontFamily: '"Inter", system-ui, sans-serif',
              fontSize: '13px',
              color: 'hsl(30 15% 55%)',
            }}>
              No results found
            </div>
          )}

          {/* Airports */}
          {results.airports.length > 0 && (
            <div>
              <div style={{
                padding: '10px 16px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'hsl(30 15% 55%)',
                background: 'hsl(30 20% 94%)',
                borderBottom: '1px solid hsl(30 15% 88%)',
              }}>
                Airports
              </div>
              {results.airports.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: currentIndex === selectedIndex ? 'hsl(15 55% 70% / 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (currentIndex !== selectedIndex) {
                        e.currentTarget.style.background = 'hsl(30 20% 94%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = currentIndex === selectedIndex
                        ? 'hsl(15 55% 70% / 0.1)'
                        : 'transparent';
                    }}
                  >
                    <div style={{ color: 'hsl(15 55% 70%)' }}>
                      {getIcon(location.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'hsl(30 20% 15%)',
                        marginBottom: '2px',
                      }}>
                        {location.name}
                      </div>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '12px',
                        color: 'hsl(30 15% 55%)',
                      }}>
                        {location.code} · {getLocationLabel(location)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cities */}
          {results.cities.length > 0 && (
            <div>
              <div style={{
                padding: '10px 16px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'hsl(30 15% 55%)',
                background: 'hsl(30 20% 94%)',
                borderTop: '1px solid hsl(30 15% 88%)',
                borderBottom: '1px solid hsl(30 15% 88%)',
              }}>
                Cities
              </div>
              {results.cities.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: currentIndex === selectedIndex ? 'hsl(15 55% 70% / 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (currentIndex !== selectedIndex) {
                        e.currentTarget.style.background = 'hsl(30 20% 94%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = currentIndex === selectedIndex
                        ? 'hsl(15 55% 70% / 0.1)'
                        : 'transparent';
                    }}
                  >
                    <div style={{ color: 'hsl(15 55% 70%)' }}>
                      {getIcon(location.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'hsl(30 20% 15%)',
                        marginBottom: '2px',
                      }}>
                        {location.name}
                      </div>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '12px',
                        color: 'hsl(30 15% 55%)',
                      }}>
                        {getLocationLabel(location)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hotels */}
          {results.hotels.length > 0 && (
            <div>
              <div style={{
                padding: '10px 16px',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                color: 'hsl(30 15% 55%)',
                background: 'hsl(30 20% 94%)',
                borderTop: '1px solid hsl(30 15% 88%)',
                borderBottom: '1px solid hsl(30 15% 88%)',
              }}>
                Hotels
              </div>
              {results.hotels.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      border: 'none',
                      background: currentIndex === selectedIndex ? 'hsl(15 55% 70% / 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (currentIndex !== selectedIndex) {
                        e.currentTarget.style.background = 'hsl(30 20% 94%)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = currentIndex === selectedIndex
                        ? 'hsl(15 55% 70% / 0.1)'
                        : 'transparent';
                    }}
                  >
                    <div style={{ color: 'hsl(15 55% 70%)' }}>
                      {getIcon(location.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: 'hsl(30 20% 15%)',
                        marginBottom: '2px',
                      }}>
                        {location.name}
                      </div>
                      <div style={{
                        fontFamily: '"Inter", system-ui, sans-serif',
                        fontSize: '12px',
                        color: 'hsl(30 15% 55%)',
                      }}>
                        {getLocationLabel(location)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
