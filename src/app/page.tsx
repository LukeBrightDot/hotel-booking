'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Hotel, Car } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Location } from '@/types/location';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'hotels' | 'cars'>('hotels');
  const [destination, setDestination] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [rooms, setRooms] = useState('1');
  const [guests, setGuests] = useState('2');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  const tomorrow = addDays(new Date(), 1);
  const minCheckOut = checkIn ? addDays(checkIn, 1) : addDays(new Date(), 2);

  const handleSearch = () => {
    if (!selectedLocation || !checkIn || !checkOut) {
      alert('Please fill in all required fields');
      return;
    }

    const params = new URLSearchParams({
      location: JSON.stringify(selectedLocation),
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      rooms,
      guests,
    });

    router.push(`/results?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Find Your Perfect Stay or Ride
          </h1>
          <p className="text-base text-gray-600">
            Search thousands of hotels and rental cars worldwide
          </p>
        </div>
      </section>

      {/* Search Form */}
      <main className="container mx-auto px-4 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Tabs - Pill style */}
          <div className="flex gap-0 mb-6">
            <button
              onClick={() => setActiveTab('hotels')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-l border transition-colors",
                activeTab === 'hotels'
                  ? "bg-[#2C5F63] text-white border-[#2C5F63]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <Hotel className="h-4 w-4" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-r border-t border-b border-r transition-colors",
                activeTab === 'cars'
                  ? "bg-[#2C5F63] text-white border-[#2C5F63]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              <Car className="h-4 w-4" />
              Cars
            </button>
          </div>

          {activeTab === 'hotels' && (
            <div className="space-y-4">
              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Destination
                </label>
                <LocationAutocomplete
                  value={destination}
                  onChange={setDestination}
                  onSelect={(location) => {
                    setSelectedLocation(location);
                  }}
                  placeholder="City or hotel name"
                  className="w-full"
                />
              </div>

              {/* Check-in Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Check-in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckInPicker(!showCheckInPicker);
                    setShowCheckOutPicker(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded text-left bg-gray-200 hover:bg-gray-300 focus:outline-none transition-colors flex items-center gap-2",
                    !checkIn && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  {checkIn ? format(checkIn, 'MMMM do, yyyy') : 'Select date'}
                </button>
                {showCheckInPicker && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                    <DayPicker
                      mode="single"
                      selected={checkIn}
                      onSelect={(date) => {
                        setCheckIn(date);
                        setShowCheckInPicker(false);
                        if (checkOut && date && checkOut <= date) {
                          setCheckOut(addDays(date, 1));
                        }
                      }}
                      disabled={{ before: tomorrow }}
                      className="bellhopping-calendar"
                    />
                  </div>
                )}
              </div>

              {/* Check-out Date */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Check-out
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckOutPicker(!showCheckOutPicker);
                    setShowCheckInPicker(false);
                  }}
                  disabled={!checkIn}
                  className={cn(
                    "w-full px-4 py-3 rounded text-left bg-gray-200 hover:bg-gray-300 focus:outline-none transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
                    !checkOut && "text-gray-500"
                  )}
                >
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                  {checkOut ? format(checkOut, 'MMMM do, yyyy') : 'Select date'}
                </button>
                {showCheckOutPicker && checkIn && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4">
                    <DayPicker
                      mode="single"
                      selected={checkOut}
                      onSelect={(date) => {
                        setCheckOut(date);
                        setShowCheckOutPicker(false);
                      }}
                      disabled={{ before: minCheckOut }}
                      className="bellhopping-calendar"
                    />
                  </div>
                )}
              </div>

              {/* Rooms */}
              <div>
                <label htmlFor="rooms" className="block text-sm font-medium text-gray-900 mb-1">
                  Rooms
                </label>
                <select
                  id="rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-[#2C5F63] transition-colors"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num.toString()}>
                      {num} Room{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Guests */}
              <div>
                <label htmlFor="guests" className="block text-sm font-medium text-gray-900 mb-1">
                  Guests
                </label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:border-[#2C5F63] transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num.toString()}>
                      {num} Guest{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Button */}
              <button
                onClick={handleSearch}
                disabled={!selectedLocation || !checkIn || !checkOut}
                className="w-full py-3 px-6 bg-[#2C5F63] text-white font-medium rounded hover:bg-[#2C5F63]/90 focus:outline-none focus:ring-2 focus:ring-[#2C5F63]/50 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
              >
                Search Hotels
              </button>
            </div>
          )}

          {activeTab === 'cars' && (
            <div className="py-12 text-center text-gray-500">
              <Car className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>Car rental search coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
