'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { Calendar, MapPin, Users, Home, Search, ChevronDown } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Header } from '@/components/booking';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { Location } from '@/types/location';

export default function BookingPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [showRoomsDropdown, setShowRoomsDropdown] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);

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
      rooms: rooms.toString(),
      guests: guests.toString(),
    });

    router.push(`/results?${params.toString()}`);
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
    <div style={{ minHeight: '100vh', background: 'hsl(30 25% 98%)' }}>
      <Header showModeToggle={true} />

      {/* Main Content */}
      <main style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 16px' }}>
          {/* Title */}
          <h1 style={{
            fontFamily: '"Inter", system-ui, sans-serif',
            fontSize: '28px',
            fontWeight: 300,
            letterSpacing: '0.02em',
            color: 'hsl(30 20% 15%)',
            marginBottom: '32px',
            textAlign: 'center',
          }}>
            Find Your Perfect Stay
          </h1>

          {/* Form Card */}
          <div style={{
            background: 'hsl(30 25% 98%)',
            border: '1px solid hsl(30 15% 90%)',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 8px 32px hsl(30 20% 15% / 0.08)',
          }}>
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
                </div>
              </div>

              {/* Check In Date */}
              <div style={{ position: 'relative' }}>
                <div
                  style={inputContainerStyle}
                  onClick={() => {
                    setShowCheckInPicker(!showCheckInPicker);
                    setShowCheckOutPicker(false);
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
                  <Calendar style={iconStyle} />
                  <div style={{ flex: 1 }}>
                    <div style={labelStyle}>Check In</div>
                    <div style={valueStyle}>
                      {checkIn ? format(checkIn, 'MMM dd, yyyy') : 'Select date'}
                    </div>
                  </div>
                </div>
                {showCheckInPicker && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 50,
                    marginTop: '8px',
                    background: 'white',
                    border: '1px solid hsl(30 15% 88%)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px hsl(30 20% 15% / 0.12)',
                    padding: '16px',
                  }}>
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

              {/* Check Out Date */}
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    ...inputContainerStyle,
                    opacity: checkIn ? 1 : 0.6,
                    cursor: checkIn ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => {
                    if (checkIn) {
                      setShowCheckOutPicker(!showCheckOutPicker);
                      setShowCheckInPicker(false);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (checkIn) {
                      e.currentTarget.style.borderColor = 'hsl(15 55% 70%)';
                      e.currentTarget.style.boxShadow = '0 2px 8px hsl(15 55% 70% / 0.15)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(30 15% 88%)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Calendar style={iconStyle} />
                  <div style={{ flex: 1 }}>
                    <div style={labelStyle}>Check Out</div>
                    <div style={valueStyle}>
                      {checkOut ? format(checkOut, 'MMM dd, yyyy') : 'Select date'}
                    </div>
                  </div>
                </div>
                {showCheckOutPicker && checkIn && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 50,
                    marginTop: '8px',
                    background: 'white',
                    border: '1px solid hsl(30 15% 88%)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px hsl(30 20% 15% / 0.12)',
                    padding: '16px',
                  }}>
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
              disabled={!selectedLocation || !checkIn || !checkOut}
              style={{
                width: '100%',
                padding: '16px 28px',
                background: (!selectedLocation || !checkIn || !checkOut)
                  ? 'hsl(30 15% 85%)'
                  : 'linear-gradient(135deg, hsl(15 55% 70%) 0%, hsl(25 50% 65%) 100%)',
                border: 'none',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: (!selectedLocation || !checkIn || !checkOut) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: (!selectedLocation || !checkIn || !checkOut)
                  ? 'none'
                  : '0 4px 16px hsl(15 55% 70% / 0.3)',
                opacity: (!selectedLocation || !checkIn || !checkOut) ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (selectedLocation && checkIn && checkOut) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 24px hsl(15 55% 70% / 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedLocation && checkIn && checkOut) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px hsl(15 55% 70% / 0.3)';
                }
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
      </main>
    </div>
  );
}
