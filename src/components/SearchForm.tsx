'use client';

import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, addDays } from 'date-fns';
import { LocationAutocomplete } from './LocationAutocomplete';
import { Location } from '@/types/location';
import { Calendar, Users, BedDouble, Search, ChevronDown } from 'lucide-react';
import 'react-day-picker/style.css';

interface SearchFormProps {
  onSearch?: (params: HotelSearchParams) => void;
  className?: string;
}

export interface HotelSearchParams {
  location: Location;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
}

export function SearchForm({ onSearch, className = '' }: SearchFormProps) {
  const [destination, setDestination] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const minCheckOut = checkIn ? addDays(checkIn, 1) : addDays(new Date(), 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!selectedLocation) {
      setError('Please select a destination');
      return;
    }

    if (!checkIn) {
      setError('Please select a check-in date');
      return;
    }

    if (!checkOut) {
      setError('Please select a check-out date');
      return;
    }

    if (checkOut <= checkIn) {
      setError('Check-out date must be after check-in date');
      return;
    }

    const searchParams: HotelSearchParams = {
      location: selectedLocation,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      rooms,
      adults,
      children,
    };

    setIsLoading(true);

    try {
      if (onSearch) {
        // Use custom handler if provided
        onSearch(searchParams);
      } else {
        // Default: Call the search API
        const response = await fetch('/api/search/hotels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(searchParams),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Search failed');
        }

        const data = await response.json();
        console.log('Search results:', data);

        // TODO: Navigate to results page with data
        // For now, just log to console
        alert(`Found ${data.count} hotels! Check console for results.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Destination */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Destination
          </span>
        </label>
        <LocationAutocomplete
          value={destination}
          onChange={setDestination}
          onSelect={(location) => {
            setSelectedLocation(location);
            setError(null);
          }}
          placeholder="City, airport, or landmark..."
          className="w-full"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-in Date */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Check-in
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setShowCheckInPicker(!showCheckInPicker);
              setShowCheckOutPicker(false);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left bg-white hover:border-[#1c5558] focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30 focus:border-[#1c5558] transition-colors"
          >
            {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
          </button>
          {showCheckInPicker && (
            <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <DayPicker
                mode="single"
                selected={checkIn}
                onSelect={(date) => {
                  setCheckIn(date);
                  setShowCheckInPicker(false);
                  // Auto-adjust checkout if needed
                  if (checkOut && date && checkOut <= date) {
                    setCheckOut(addDays(date, 1));
                  }
                }}
                disabled={{ before: tomorrow }}
                className="rdp-custom"
              />
            </div>
          )}
        </div>

        {/* Check-out Date */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Check-out
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              setShowCheckOutPicker(!showCheckOutPicker);
              setShowCheckInPicker(false);
            }}
            disabled={!checkIn}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left bg-white hover:border-[#1c5558] focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30 focus:border-[#1c5558] transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
          </button>
          {showCheckOutPicker && checkIn && (
            <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
              <DayPicker
                mode="single"
                selected={checkOut}
                onSelect={(date) => {
                  setCheckOut(date);
                  setShowCheckOutPicker(false);
                }}
                disabled={{ before: minCheckOut }}
                className="rdp-custom"
              />
            </div>
          )}
        </div>
      </div>

      {/* Rooms and Guests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rooms */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <BedDouble className="w-4 h-4" />
              Rooms
            </span>
          </label>
          <div className="relative">
            <select
              value={rooms}
              onChange={(e) => setRooms(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-[#1c5558] focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30 focus:border-[#1c5558] transition-colors appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Room' : 'Rooms'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Adults */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Adults
            </span>
          </label>
          <div className="relative">
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-[#1c5558] focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30 focus:border-[#1c5558] transition-colors appearance-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {/* Children */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Children
            </span>
          </label>
          <div className="relative">
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-[#1c5558] focus:outline-none focus:ring-2 focus:ring-[#1c5558]/30 focus:border-[#1c5558] transition-colors appearance-none cursor-pointer"
            >
              {[0, 1, 2, 3, 4].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !selectedLocation}
        className="w-full py-4 px-6 bg-[#1c5558] text-white font-semibold rounded-lg hover:bg-[#1c5558]/90 focus:outline-none focus:ring-4 focus:ring-[#1c5558]/30 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Searching Hotels...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Hotels
          </>
        )}
      </button>

      {/* Search Summary */}
      {selectedLocation && checkIn && checkOut && (
        <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg text-sm">
          <p className="text-gray-700">
            <strong className="text-[#1c5558]">Searching:</strong> {selectedLocation.name}, {selectedLocation.city} •{' '}
            {format(checkIn, 'MMM dd')} - {format(checkOut, 'MMM dd')} •{' '}
            {rooms} {rooms === 1 ? 'room' : 'rooms'} •{' '}
            {adults} {adults === 1 ? 'adult' : 'adults'}
            {children > 0 && `, ${children} ${children === 1 ? 'child' : 'children'}`}
          </p>
        </div>
      )}
    </form>
  );
}
