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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedValue = useDebounce(value, 200);

  // Fetch autocomplete results
  useEffect(() => {
    if (debouncedValue.length >= 2) {
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
  }, [debouncedValue]);

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
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'airport':
        return <Plane className="h-4 w-4" />;
      case 'city':
        return <MapPin className="h-4 w-4" />;
      case 'hotel':
        return <Building2 className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
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
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {!hasResults && debouncedValue.length >= 2 && !isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No results found
            </div>
          )}

          {/* Airports */}
          {results.airports.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                AIRPORTS
              </div>
              {results.airports.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 ${
                      currentIndex === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-gray-400">{getIcon(location.type)}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500">
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
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-t">
                CITIES
              </div>
              {results.cities.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 ${
                      currentIndex === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-gray-400">{getIcon(location.type)}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500">
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
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-t">
                HOTELS
              </div>
              {results.hotels.map((location) => {
                const currentIndex = resultIndex++;
                return (
                  <button
                    key={location.id}
                    onClick={() => handleSelect(location)}
                    className={`w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3 ${
                      currentIndex === selectedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-gray-400">{getIcon(location.type)}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {location.name}
                      </div>
                      <div className="text-xs text-gray-500">
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
