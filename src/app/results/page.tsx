'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star, MapPin, Loader2 } from 'lucide-react';
import type { HotelSearchResult } from '@/lib/sabre/search';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Using shadcn/ui components */}
          <aside className="lg:w-64 flex-shrink-0">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Filters</h3>

              {/* Price Range */}
              <div className="mb-6">
                <Label className="mb-2 block">Price Range</Label>
                <Slider
                  value={[priceRange]}
                  onValueChange={(value) => setPriceRange(value[0])}
                  max={500}
                  step={10}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$0</span>
                  <span>${priceRange}</span>
                </div>
              </div>

              {/* Star Rating */}
              <div className="mb-6">
                <Label className="mb-2 block">Star Rating</Label>
                <div className="space-y-2">
                  {[5, 4, 3].map((rating) => (
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
                <Label className="mb-2 block">Amenities</Label>
                <div className="space-y-2">
                  {["Wifi", "Pool", "Spa", "Parking"].map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Checkbox id={amenity} />
                      <label htmlFor={amenity} className="text-sm cursor-pointer">{amenity}</label>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#2C5F63]" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded p-6 text-center">
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 bg-[#2C5F63] text-white rounded hover:bg-[#2C5F63]/90"
                >
                  Back to Search
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {filteredHotels.length} hotels found
                    </h2>
                    {latencyMs !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sabre API time: {(latencyMs / 1000).toFixed(1)}s
                      </p>
                    )}
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#2C5F63]"
                  >
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Star Rating</option>
                  </select>
                </div>

                {/* Hotel Cards - Using shadcn/ui components */}
                <div className="space-y-4">
                  {filteredHotels.map((hotel) => (
                    <Card
                      key={hotel.hotelCode}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleViewDetails(hotel)}
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Hotel Image */}
                        <img
                          src={hotel.thumbnail}
                          alt={hotel.hotelName}
                          className="w-full md:w-64 h-48 object-cover"
                          loading="lazy"
                        />

                        {/* Hotel Info */}
                        <CardContent className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-xl font-semibold mb-1">{hotel.hotelName}</h3>

                              {/* Location */}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {hotel.address.city && hotel.address.state
                                    ? `${hotel.address.city}, ${hotel.address.state}`
                                    : hotel.address.city || 'Location unavailable'}
                                </span>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                {hotel.lowestRate && hotel.lowestRate > 0
                                  ? `$${hotel.lowestRate.toFixed(0)}`
                                  : "Call for Price"}
                              </div>
                              <div className="text-sm text-muted-foreground">per night</div>
                            </div>
                          </div>

                          {/* Star Rating */}
                          {hotel.starRating && hotel.starRating > 0 && (
                            <div className="flex items-center gap-0.5 mb-3">
                              {Array.from({ length: Math.floor(hotel.starRating) }).map((_, i) => (
                                <Star key={i} className="h-4 w-4 fill-[#D9A021] text-[#D9A021]" />
                              ))}
                            </div>
                          )}

                          {/* Amenities */}
                          {hotel.amenities && hotel.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {hotel.amenities.slice(0, 3).map((amenity, i) => (
                                <span
                                  key={i}
                                  className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-sm"
                                >
                                  {amenity.description}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* View Details Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(hotel);
                            }}
                          >
                            View Details
                          </Button>
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
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
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#2C5F63]" />
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
