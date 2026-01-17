'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';
import Link from 'next/link';
import type { HotelSearchResult } from '@/lib/sabre/search';

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const hotelCode = params.hotelCode as string;
  const [hotel, setHotel] = useState<HotelSearchResult | null>(null);

  useEffect(() => {
    // Retrieve hotel data from session storage
    const storedData = sessionStorage.getItem(`hotel-${hotelCode}`);
    if (storedData) {
      setHotel(JSON.parse(storedData));
    } else {
      // If no data in session storage, redirect back to search
      router.push('/');
    }
  }, [hotelCode, router]);

  if (!hotel) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  const displayImage = hotel.images && hotel.images.length > 0
    ? hotel.images[0]
    : hotel.thumbnail || null;

  return (
    <div className="min-h-screen bg-white">
      <main className="container mx-auto px-4 py-4">
        {/* Back Link */}
        <Link
          href="/results"
          className="text-[#2C5F63] hover:underline text-sm mb-4 inline-block"
        >
          Back to results
        </Link>

        {/* Hotel Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {hotel.hotelName}
            </h1>

            {/* Star Rating */}
            {hotel.starRating && hotel.starRating > 0 && (
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: Math.floor(hotel.starRating) }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-[#D9A021] text-[#D9A021]" />
                ))}
              </div>
            )}

            {/* Address */}
            <div className="flex items-start gap-1 text-gray-600 text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                {hotel.address.addressLine1 && (
                  <span>{hotel.address.addressLine1}</span>
                )}
                {hotel.address.city && (
                  <span>
                    {hotel.address.addressLine1 ? ', ' : ''}
                    {hotel.address.city}
                    {hotel.address.state ? `, ${hotel.address.state}` : ''}
                    {hotel.address.postalCode ? ` ${hotel.address.postalCode}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="text-right mt-4 md:mt-0">
            <span className="text-gray-600 text-sm">Call for pricing</span>
          </div>
        </div>

        {/* Hero Image */}
        {displayImage && (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden bg-gray-200">
            <img
              src={displayImage}
              alt={hotel.hotelName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}
