'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, SlidersHorizontal, X } from 'lucide-react';
import { Header } from '@/components/booking';
import { ResortCard, type Resort } from '@/components/voice/ResortCard';
import type { HotelSearchResult } from '@/lib/sabre/search';

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('price-asc');
  const [priceRange, setPriceRange] = useState(500);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchHotels = async () => {
      setLoading(true);
      setError(null);
      setLatencyMs(null);

      const locationStr = searchParams.get('location');
      const checkIn = searchParams.get('checkIn');
      const checkOut = searchParams.get('checkOut');
      const rooms = searchParams.get('rooms');
      const guests = searchParams.get('guests');

      if (!locationStr || !checkIn || !checkOut) {
        setError('Missing search parameters');
        setLoading(false);
        return;
      }

      try {
        const location = JSON.parse(locationStr);
        const start = performance.now();

        const response = await fetch('/api/search/hotels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location,
            checkIn,
            checkOut,
            rooms: parseInt(rooms || '1'),
            adults: parseInt(guests || '2'),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Search failed');
        }

        const data = await response.json();
        const duration = performance.now() - start;

        console.log('✅ Full API Response:', data);
        console.log('✅ First Hotel:', data.results?.[0]);
        setHotels(data.results || []);
        setLatencyMs(duration);
      } catch (err) {
        console.error('❌ Search error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [searchParams]);

  // Convert HotelSearchResult to Resort format
  const convertToResort = (hotel: HotelSearchResult): Resort => {
    const amenities: string[] = [];

    // Add some common amenities based on hotel data
    if (hotel.starRating && hotel.starRating >= 4) amenities.push('Luxury');
    amenities.push('WiFi', 'Room Service');

    return {
      id: hotel.hotelCode,
      name: hotel.hotelName,
      location: hotel.address?.city
        ? `${hotel.address.city}${hotel.address.state ? ', ' + hotel.address.state : ''}`
        : hotel.address?.countryName || 'Location',
      description: hotel.description || `Experience luxury at ${hotel.hotelName}`,
      pricePerNight: hotel.lowestRate && hotel.lowestRate > 0
        ? `$${Math.round(hotel.lowestRate)}`
        : 'Contact for pricing',
      rating: hotel.starRating || 0,
      amenities,
      imageUrl: hotel.thumbnail,
    };
  };

  const filteredHotels = hotels
    .filter((hotel) => {
      const price = hotel.lowestRate || 0;
      if (price > priceRange) return false;
      if (selectedRatings.length > 0 && hotel.starRating) {
        if (!selectedRatings.includes(Math.floor(hotel.starRating))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aPrice = a.lowestRate || 0;
      const bPrice = b.lowestRate || 0;
      if (sortBy === 'price-asc') return aPrice - bPrice;
      if (sortBy === 'price-desc') return bPrice - aPrice;
      if (sortBy === 'rating') return (b.starRating || 0) - (a.starRating || 0);
      return 0;
    });

  const toggleRating = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    );
  };

  const handleViewDetails = (hotel: HotelSearchResult) => {
    sessionStorage.setItem(`hotel-${hotel.hotelCode}`, JSON.stringify(hotel));
    router.push(`/hotels/${hotel.hotelCode}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'hsl(30 25% 98%)' }}>
      <Header showModeToggle={true} />

      <main style={{ paddingTop: '80px', paddingBottom: '40px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
          {/* Header Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div>
              <h1 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '32px',
                fontWeight: 300,
                letterSpacing: '0.02em',
                color: 'hsl(30 20% 15%)',
                marginBottom: '8px',
              }}>
                {loading ? 'Searching...' : `${filteredHotels.length} Hotels Found`}
              </h1>
              {latencyMs !== null && (
                <p style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '13px',
                  color: 'hsl(30 15% 55%)',
                }}>
                  Found in {(latencyMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: 'hsl(30 20% 96%)',
                  border: '1px solid hsl(30 15% 88%)',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '14px',
                  color: 'hsl(30 20% 15%)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Star Rating</option>
              </select>

              {/* Filter Toggle Button (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: showFilters ? 'hsl(15 55% 70%)' : 'hsl(30 20% 96%)',
                  border: '1px solid hsl(30 15% 88%)',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '14px',
                  color: showFilters ? 'white' : 'hsl(30 20% 15%)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {showFilters ? <X style={{ width: '16px', height: '16px' }} /> : <SlidersHorizontal style={{ width: '16px', height: '16px' }} />}
                Filters
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Filters Sidebar */}
            {showFilters && (
              <aside style={{
                width: '280px',
                flexShrink: 0,
                background: 'hsl(30 25% 98%)',
                border: '1px solid hsl(30 15% 90%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 16px hsl(30 20% 15% / 0.08)',
              }}>
                <h3 style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'hsl(30 15% 45%)',
                  marginBottom: '24px',
                }}>
                  Filters
                </h3>

                {/* Price Range */}
                <div style={{ marginBottom: '32px' }}>
                  <label style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'hsl(30 15% 55%)',
                    display: 'block',
                    marginBottom: '12px',
                  }}>
                    Max Price per Night
                  </label>
                  <input
                    type="range"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    min="0"
                    max="500"
                    step="10"
                    style={{ width: '100%', marginBottom: '8px' }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '13px',
                    color: 'hsl(30 15% 55%)',
                  }}>
                    <span>$0</span>
                    <span style={{ fontWeight: 500, color: 'hsl(15 55% 70%)' }}>${priceRange}</span>
                  </div>
                </div>

                {/* Star Rating */}
                <div>
                  <label style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'hsl(30 15% 55%)',
                    display: 'block',
                    marginBottom: '12px',
                  }}>
                    Star Rating
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label
                        key={rating}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedRatings.includes(rating)}
                          onChange={() => toggleRating(rating)}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: 'hsl(15 55% 70%)',
                          }}
                        />
                        <span style={{
                          fontFamily: '"Inter", system-ui, sans-serif',
                          fontSize: '14px',
                          color: 'hsl(30 20% 25%)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          {rating} <span style={{ color: 'hsl(42 65% 50%)' }}>★</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </aside>
            )}

            {/* Results Grid */}
            <div style={{ flex: 1 }}>
              {loading ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '80px 0',
                }}>
                  <Loader2 style={{ width: '32px', height: '32px', color: 'hsl(15 55% 70%)' }} className="animate-spin" />
                </div>
              ) : error ? (
                <div style={{
                  borderRadius: '16px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: 'hsl(15 70% 95%)',
                  border: '1px solid hsl(15 60% 85%)',
                }}>
                  <p style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '15px',
                    color: 'hsl(15 50% 40%)',
                    marginBottom: '24px',
                  }}>
                    {error}
                  </p>
                  <button
                    onClick={() => router.push('/')}
                    style={{
                      padding: '12px 32px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, hsl(15 55% 70%) 0%, hsl(25 50% 65%) 100%)',
                      border: 'none',
                      fontFamily: '"Inter", system-ui, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 16px hsl(15 55% 70% / 0.3)',
                    }}
                  >
                    Back to Search
                  </button>
                </div>
              ) : filteredHotels.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '80px 0',
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '15px',
                  color: 'hsl(30 15% 55%)',
                }}>
                  No hotels found matching your criteria.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '24px',
                }}>
                  {filteredHotels.map((hotel, index) => (
                    <ResortCard
                      key={hotel.hotelCode}
                      resort={convertToResort(hotel)}
                      index={index}
                      onClick={() => handleViewDetails(hotel)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'hsl(30 25% 98%)',
      }}>
        <Loader2 style={{ width: '32px', height: '32px', color: 'hsl(15 55% 70%)' }} className="animate-spin" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
