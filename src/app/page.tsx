'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Hotel, Car } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Location } from '@/types/location';

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
    <div className="min-h-screen" style={{ background: 'hsl(30 25% 98%)' }}>
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-3"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: 'hsl(30 15% 25%)' }}>
            Find Your Perfect Stay
          </h1>
          <p className="text-sm tracking-[0.15em] uppercase font-light"
             style={{ color: 'hsl(30 10% 50%)' }}>
            Discover extraordinary destinations worldwide
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
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-light tracking-[0.1em] uppercase rounded-l-full transition-all duration-300"
              style={activeTab === 'hotels' ? {
                background: 'hsl(15 45% 65%)',
                color: 'white',
                border: '1px solid hsl(15 45% 65%)',
                boxShadow: '0 2px 8px hsl(15 45% 65% / 0.3)',
              } : {
                background: 'white',
                color: 'hsl(30 10% 50%)',
                border: '1px solid hsl(30 20% 85%)',
              }}
            >
              <Hotel className="h-4 w-4" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('cars')}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-light tracking-[0.1em] uppercase rounded-r-full transition-all duration-300"
              style={activeTab === 'cars' ? {
                background: 'hsl(15 45% 65%)',
                color: 'white',
                border: '1px solid hsl(15 45% 65%)',
                boxShadow: '0 2px 8px hsl(15 45% 65% / 0.3)',
              } : {
                background: 'white',
                color: 'hsl(30 10% 50%)',
                border: '1px solid hsl(30 20% 85%)',
                borderLeft: 'none',
              }}
            >
              <Car className="h-4 w-4" />
              Cars
            </button>
          </div>

          {activeTab === 'hotels' && (
            <div className="space-y-4">
              {/* Destination */}
              <div>
                <label className="block text-xs font-light tracking-[0.1em] uppercase mb-2" style={{ color: 'hsl(30 10% 50%)' }}>
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
                <label className="block text-xs font-light tracking-[0.1em] uppercase mb-2" style={{ color: 'hsl(30 10% 50%)' }}>
                  Check-in
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckInPicker(!showCheckInPicker);
                    setShowCheckOutPicker(false);
                  }}
                  className="w-full px-4 py-3 rounded-lg text-left bg-white focus:outline-none transition-all duration-300 flex items-center gap-2"
                  style={{
                    border: '1px solid hsl(30 20% 85%)',
                    color: checkIn ? 'hsl(30 15% 25%)' : 'hsl(30 10% 50%)'
                  }}
                >
                  <CalendarIcon className="h-4 w-4" style={{ color: 'hsl(30 10% 50%)' }} />
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
                <label className="block text-xs font-light tracking-[0.1em] uppercase mb-2" style={{ color: 'hsl(30 10% 50%)' }}>
                  Check-out
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckOutPicker(!showCheckOutPicker);
                    setShowCheckInPicker(false);
                  }}
                  disabled={!checkIn}
                  className="w-full px-4 py-3 rounded-lg text-left bg-white focus:outline-none transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    border: '1px solid hsl(30 20% 85%)',
                    color: checkOut ? 'hsl(30 15% 25%)' : 'hsl(30 10% 50%)'
                  }}
                >
                  <CalendarIcon className="h-4 w-4" style={{ color: 'hsl(30 10% 50%)' }} />
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
                <label htmlFor="rooms" className="block text-xs font-light tracking-[0.1em] uppercase mb-2" style={{ color: 'hsl(30 10% 50%)' }}>
                  Rooms
                </label>
                <select
                  id="rooms"
                  value={rooms}
                  onChange={(e) => setRooms(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white transition-all duration-300 focus:outline-none"
                  style={{ border: '1px solid hsl(30 20% 85%)', color: 'hsl(30 15% 25%)' }}
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
                <label htmlFor="guests" className="block text-xs font-light tracking-[0.1em] uppercase mb-2" style={{ color: 'hsl(30 10% 50%)' }}>
                  Guests
                </label>
                <select
                  id="guests"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white transition-all duration-300 focus:outline-none"
                  style={{ border: '1px solid hsl(30 20% 85%)', color: 'hsl(30 15% 25%)' }}
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
                className="w-full py-3 px-6 text-white text-sm font-light tracking-[0.15em] uppercase rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'hsl(35 50% 75%)',
                  boxShadow: '0 4px 12px hsl(35 50% 75% / 0.4)',
                }}
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
