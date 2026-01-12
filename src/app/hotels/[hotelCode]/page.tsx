'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, MapPin, ArrowLeft, Check } from 'lucide-react';
import type { HotelSearchResult } from '@/lib/sabre/search';

export default function HotelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const hotelCode = params.hotelCode as string;
  const [hotel, setHotel] = useState<HotelSearchResult | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    // Retrieve hotel data from session storage
    const storedData = sessionStorage.getItem(`hotel-${hotelCode}`);
    if (storedData) {
      setHotel(JSON.parse(storedData));
    } else {
      // If no data in session storage, redirect back to search
      // In production, you could fetch hotel details from API here
      router.push('/');
    }
  }, [hotelCode, router]);

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  const displayImages = hotel.images && hotel.images.length > 0
    ? hotel.images
    : hotel.thumbnail
    ? [hotel.thumbnail]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-[#2C5F63] mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Results
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Hotel Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {hotel.hotelName}
                </h1>

                {/* Star Rating */}
                {hotel.starRating && hotel.starRating > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: Math.floor(hotel.starRating) }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-[#D9A021] text-[#D9A021]" />
                    ))}
                  </div>
                )}

                {/* Address */}
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    {hotel.address.addressLine1 && (
                      <p>{hotel.address.addressLine1}</p>
                    )}
                    <p>
                      {hotel.address.city && hotel.address.state
                        ? `${hotel.address.city}, ${hotel.address.state} ${hotel.address.postalCode || ''}`
                        : hotel.address.city || ''}
                    </p>
                    {hotel.address.country && <p>{hotel.address.country}</p>}
                  </div>
                </div>

                {/* Distance */}
                {hotel.distance && (
                  <p className="text-sm text-gray-600 mt-2">
                    {hotel.distance.toFixed(1)} miles from search location
                  </p>
                )}
              </div>

              {/* Price Range */}
              <div className="text-right mt-4 md:mt-0">
                {hotel.lowestRate && hotel.lowestRate > 0 ? (
                  <>
                    <div className="text-sm text-gray-600 mb-1">Starting from</div>
                    <div className="text-4xl font-bold text-gray-900">
                      ${hotel.lowestRate.toFixed(0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">per night</div>
                    {hotel.rateCount && hotel.rateCount > 1 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {hotel.rateCount} room types available
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-600">Call for pricing</div>
                )}
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          {displayImages.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <div className="grid gap-4">
                {/* Main Image */}
                <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={displayImages[selectedImage]}
                    alt={`${hotel.hotelName} - View ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML =
                        '<div class="w-full h-full flex items-center justify-center text-gray-400">Image unavailable</div>';
                    }}
                  />
                </div>

                {/* Thumbnail Gallery */}
                {displayImages.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {displayImages.slice(0, 5).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        className={`h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === idx
                            ? 'border-[#D9A021]'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hotel.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-[#2C5F63] flex-shrink-0" />
                    <span className="text-sm text-gray-700">{amenity.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Types - THE KEY FEATURE */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Rooms</h2>

            {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
              <div className="space-y-4">
                {hotel.roomTypes.map((room, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-5 hover:border-[#2C5F63] transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {room.roomType}
                        </h3>

                        {room.description && (
                          <p className="text-sm text-gray-600 mb-3">
                            {room.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          {room.bedType && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Bed:</span>
                              <span>{room.bedType}</span>
                            </div>
                          )}
                          {room.maxOccupancy && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Max Occupancy:</span>
                              <span>{room.maxOccupancy} guests</span>
                            </div>
                          )}
                          {room.rateCode && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Rate Code:</span>
                              <span>{room.rateCode}</span>
                            </div>
                          )}
                        </div>

                        {room.cancellation && (
                          <div className="mt-3 text-xs text-gray-500">
                            Cancellation: {room.cancellation}
                          </div>
                        )}
                      </div>

                      {/* Room Price & Booking */}
                      <div className="mt-4 md:mt-0 md:ml-6 text-right">
                        {room.amountAfterTax > 0 ? (
                          <>
                            {room.amountBeforeTax !== room.amountAfterTax && (
                              <div className="text-sm text-gray-500 line-through">
                                ${room.amountBeforeTax.toFixed(0)}
                              </div>
                            )}
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                              ${room.amountAfterTax.toFixed(0)}
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                              per night (incl. taxes)
                            </div>
                            <button className="w-full md:w-auto px-6 py-3 bg-[#2C5F63] text-white font-medium rounded-lg hover:bg-[#2C5F63]/90 transition-colors">
                              Book Now
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-600 italic">
                            Call for price
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No room information available. Please contact the hotel directly.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
