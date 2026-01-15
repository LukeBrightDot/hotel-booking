'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { HotelSearchResult } from '@/lib/sabre/search';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const currentHotel = filteredHotels[currentIndex];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredHotels.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredHotels.length) % filteredHotels.length);
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(30 25% 98%)' }}>
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:w-48 flex-shrink-0">
            <div className="pb-4 mb-4" style={{ borderBottom: '1px solid hsl(30 20% 85%)' }}>
              <h3 className="text-xs font-light tracking-[0.15em] uppercase mb-4" style={{ color: 'hsl(30 15% 25%)' }}>Filters</h3>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="mb-2 block text-xs font-light tracking-[0.1em] uppercase" style={{ color: 'hsl(30 10% 50%)' }}>Price Range</Label>
                <Slider
                  value={[priceRange]}
                  onValueChange={(value) => setPriceRange(value[0])}
                  max={500}
                  step={10}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>${priceRange}</span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <Label className="mb-2 block text-xs font-light tracking-[0.1em] uppercase" style={{ color: 'hsl(30 10% 50%)' }}>Star Rating</Label>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <Checkbox
                        id={`rating-${rating}`}
                        checked={selectedRatings.includes(rating)}
                        onCheckedChange={() => toggleRating(rating)}
                      />
                      <label htmlFor={`rating-${rating}`} className="flex items-center gap-1 text-sm cursor-pointer">
                        {rating} <Star className="h-3 w-3 fill-[#D9A021] text-[#D9A021]" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <Label className="mb-2 block text-xs font-light tracking-[0.1em] uppercase" style={{ color: 'hsl(30 10% 50%)' }}>Amenities</Label>
                <div className="space-y-2">
                  {["WiFi", "Pool", "Spa", "Parking"].map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Checkbox id={amenity} />
                      <label htmlFor={amenity} className="text-sm cursor-pointer text-gray-700">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(15 45% 65%)' }} />
              </div>
            ) : error ? (
              <div className="rounded-lg p-6 text-center" style={{ background: 'hsl(15 70% 95%)', border: '1px solid hsl(15 60% 85%)' }}>
                <p className="mb-4" style={{ color: 'hsl(15 50% 40%)' }}>{error}</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 text-white rounded-full text-sm font-light tracking-[0.1em] uppercase transition-all duration-300"
                  style={{ background: 'hsl(15 45% 65%)', boxShadow: '0 2px 8px hsl(15 45% 65% / 0.3)' }}
                >
                  Back to Search
                </button>
              </div>
            ) : filteredHotels.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: 'hsl(30 10% 50%)' }}>No hotels found matching your criteria.</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-light tracking-wide" style={{ color: 'hsl(30 15% 25%)', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                      {filteredHotels.length} hotels found
                    </h2>
                    {latencyMs !== null && (
                      <p className="text-xs mt-0.5" style={{ color: 'hsl(30 10% 50%)' }}>
                        Sabre API time: {(latencyMs / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentIndex(0);
                    }}
                    className="px-4 py-2 rounded-lg bg-white text-sm focus:outline-none transition-all duration-300"
                    style={{ border: '1px solid hsl(30 20% 85%)', color: 'hsl(30 15% 25%)' }}
                  >
                    <option value="price-asc">Price per night</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Star Rating</option>
                  </select>
                </div>

                {/* Hero Image Carousel */}
                {currentHotel && (
                  <div
                    className="relative w-full aspect-[16/9] rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleViewDetails(currentHotel)}
                  >
                    {/* Hotel Image */}
                    <img
                      src={currentHotel.thumbnail}
                      alt={currentHotel.hotelName}
                      className="w-full h-full object-cover"
                    />

                    {/* Navigation Arrows */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToPrev();
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        goToNext();
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>

                    {/* Navigation Dots */}
                    <div className="absolute bottom-4 left-4 flex gap-1.5">
                      {filteredHotels.slice(0, 10).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(idx);
                          }}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                      {filteredHotels.length > 10 && (
                        <span className="text-white text-xs ml-2">+{filteredHotels.length - 10}</span>
                      )}
                    </div>

                    {/* Hotel Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-16">
                      <h3 className="text-white text-2xl font-semibold mb-1">{currentHotel.hotelName}</h3>
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        {currentHotel.starRating && currentHotel.starRating > 0 && (
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: Math.floor(currentHotel.starRating) }).map((_, i) => (
                              <Star key={i} className="h-4 w-4 fill-[#D9A021] text-[#D9A021]" />
                            ))}
                          </div>
                        )}
                        <span>
                          {currentHotel.address?.city && currentHotel.address?.state
                            ? `${currentHotel.address.city}, ${currentHotel.address.state}`
                            : currentHotel.address?.city || ''}
                        </span>
                      </div>
                      {currentHotel.lowestRate && currentHotel.lowestRate > 0 && (
                        <div className="mt-2 text-white text-lg font-semibold">
                          ${currentHotel.lowestRate.toFixed(0)} <span className="text-sm font-normal text-white/80">per night</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hotel counter */}
                <p className="text-center text-xs tracking-[0.1em] uppercase mt-4" style={{ color: 'hsl(30 10% 50%)' }}>
                  Showing {currentIndex + 1} of {filteredHotels.length} hotels
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'hsl(30 25% 98%)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(15 45% 65%)' }} />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
