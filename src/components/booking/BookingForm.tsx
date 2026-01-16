'use client';

import React, { useState } from 'react';
import { Calendar, MapPin, Users, Home, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

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

  // Format date for display
  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return null;
    return format(date, 'MMM dd, yyyy');
  };

  // Handle date change from input
  const handleDateChange = (value: string, setter: (date: Date | undefined) => void) => {
    if (value) {
      setter(new Date(value));
    } else {
      setter(undefined);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Get check-in date in YYYY-MM-DD format for check-out min attribute
  const getCheckInString = () => {
    return checkIn ? checkIn.toISOString().split('T')[0] : getTodayString();
  };

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
          <div>
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
                <input
                  type="date"
                  min={getTodayString()}
                  onChange={(e) => handleDateChange(e.target.value, setCheckIn)}
                  style={{
                    ...valueStyle,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    padding: 0,
                    colorScheme: 'light',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Check Out Date */}
          <div>
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
                <input
                  type="date"
                  min={getCheckInString()}
                  onChange={(e) => handleDateChange(e.target.value, setCheckOut)}
                  style={{
                    ...valueStyle,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    padding: 0,
                    colorScheme: 'light',
                  }}
                />
              </div>
            </div>
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
