import { getAuthToken, getApiBaseUrl } from './auth';
import { Location } from '@/types/location';

export interface HotelSearchParams {
  location: Location;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  rooms?: number;
  adults?: number;
  children?: number;
  radius?: number; // Search radius in miles
}

export interface RoomType {
  roomType: string;
  description?: string;
  rateCode?: string;
  amountBeforeTax: number;
  amountAfterTax: number;
  currencyCode: string;
  bedType?: string;
  maxOccupancy?: number;
  guarantee?: string;
  cancellation?: string;
}

export interface HotelSearchResult {
  hotelCode: string;
  hotelName: string;
  chainCode?: string;
  chainName?: string;
  starRating?: number;
  address: {
    addressLine1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  lowestRate?: number;
  highestRate?: number;
  currencyCode?: string;
  rateCount?: number;
  thumbnail?: string;
  images?: string[];
  amenities?: Array<{ code: string; description: string }>;
  distance?: number; // Distance from search point in miles
  roomTypes: RoomType[]; // ALL available room types and rates
}

/**
 * Build Sabre GeoSearch payload based on location type
 */
function buildSearchPayload(params: HotelSearchParams) {
  const {
    location,
    checkIn,
    checkOut,
    rooms = 1,
    adults = 1,
    children = 0,
    radius = 20,
  } = params;

  // CRITICAL: Use YYYY-MM-DDTHH:MM:SS format (matching working implementation)
  const startDate = `${checkIn}T00:00:00`;
  const endDate = `${checkOut}T00:00:00`;

  // CRITICAL: Sabre supports TWO different GeoSearch methods:
  // 1. GeoCode - for latitude/longitude coordinates (FASTER - 3.6% avg, up to 7.6% in some locations)
  // 2. RefPoint - for airport/city codes (SLOWER - requires code lookup before coordinate search)
  //
  // PERFORMANCE DATA (from 72 test combinations):
  // - GeoCode avg: 3,296ms | RefPoint avg: 3,421ms
  // - GeoCode advantage increases with larger search radius (20+ miles)
  // - Best performance on API v5.1.0 and v3.0.0
  //
  // STRATEGY: Prefer GeoCode when coordinates available (faster!), fallback to RefPoint

  // Build GeoRef based on available location data
  let geoRef: any;

  if (location.lat && location.lng) {
    // METHOD 1 (PREFERRED): GeoCode - Direct coordinate search
    // 3.6% faster on average, up to 7.6% faster in NYC
    // Best performance with radius ≥20 miles
    geoRef = {
      Radius: radius,
      UOM: 'MI',
      GeoCode: {
        Latitude: parseFloat(location.lat.toString()),
        Longitude: parseFloat(location.lng.toString()),
      },
    };
  } else if (location.code && (location.type === 'airport' || location.type === 'city')) {
    // METHOD 2 (FALLBACK): RefPoint with CODE
    // Used when coordinates not available
    // Requires Sabre to lookup code → coordinates (adds latency)
    geoRef = {
      Radius: radius,
      UOM: 'MI',
      RefPoint: {
        Value: location.code,
        ValueContext: 'CODE',  // Valid: "CODE" or "NAME", NOT "GEO"!
        RefPointType: '6',
      },
    };
  } else {
    // Fallback: use ORD airport code
    geoRef = {
      Radius: radius,
      UOM: 'MI',
      RefPoint: {
        Value: 'ORD',
        ValueContext: 'CODE',
        RefPointType: '6',
      },
    };
  }

  // GOLDEN PAYLOAD - based on official Sabre v4.1.0 YAML spec
  // BestOnly: '1' returns cheapest rate only (standard behavior)
  // NOTE: Sabre V5 search endpoint may not return MediaItems - images may require separate Content API
  return {
    GetHotelAvailRQ: {
      version: '5.1.0',
      SearchCriteria: {
        GeoSearch: {
          GeoRef: geoRef,
        },
        RateInfoRef: {
          CurrencyCode: 'USD',
          BestOnly: '1',  // Restored to working value
          StayDateTimeRange: {
            StartDate: startDate,
            EndDate: endDate,
          },
          Rooms: {
            Room: [
              { Index: 1, Adults: adults }
            ],
          },
        },
      },
    },
  };
}

/**
 * Extract hero image from Sabre MediaItems
 *
 * Sabre V5 CSL returns images in: HotelInfo.MediaItems.MediaItem[]
 * We want high-quality images that aren't maps
 */
function getHeroImage(hotelInfo: any): string {
  const mediaItems = hotelInfo?.MediaItems?.MediaItem || [];

  if (mediaItems.length === 0) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'; // Fallback
  }

  // Priority 1: Find JPG images that aren't maps
  const heroImage = mediaItems.find((item: any) => {
    const isJPG = item.Format === 'JPG' || item.Format === 'JPEG';
    const categoryText = item.Category?.Description?.Text?.toLowerCase() || '';
    const categoryCode = item.Category?.Text?.toLowerCase() || '';
    const isNotMap = !categoryText.includes('map') && !categoryCode.includes('map');

    return isJPG && isNotMap;
  });

  if (heroImage?.Url) {
    return heroImage.Url;
  }

  // Priority 2: Just get the first non-map image
  const anyNonMapImage = mediaItems.find((item: any) => {
    const categoryText = item.Category?.Description?.Text?.toLowerCase() || '';
    const categoryCode = item.Category?.Text?.toLowerCase() || '';
    return !categoryText.includes('map') && !categoryCode.includes('map');
  });

  if (anyNonMapImage?.Url) {
    return anyNonMapImage.Url;
  }

  // Priority 3: Just use the first image
  return mediaItems[0]?.Url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
}

/**
 * Parse Sabre hotel search response into our format
 */
function parseHotelResults(sabreResponse: any): HotelSearchResult[] {
  const hotelAvailInfos = sabreResponse?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo;

  if (!Array.isArray(hotelAvailInfos)) {
    return [];
  }

  return hotelAvailInfos.map((hotel: any) => {
    const hotelInfo = hotel.HotelInfo || {};
    const locationInfo = hotelInfo.LocationInfo || {};
    const address = locationInfo.Address || {};
    const geoCoords = locationInfo.GeoCoordinates || {};

    // CRITICAL: Extract images from HotelInfo.MediaItems (Sabre V5 CSL format)
    // NOT from hotel.MediaContent (old format)
    const mediaItems = hotelInfo.MediaItems?.MediaItem || [];

    // Extract ALL room types and rates (not just cheapest)
    // CRITICAL: Sabre returns pricing in ConvertedRateInfo, NOT RateInfo
    const allRateInfos = hotel.HotelRateInfo?.RateInfos?.ConvertedRateInfo || [];

    // DEBUG: Log rate and image information for debugging
    console.log(`📊 Hotel: ${hotelInfo.HotelName}`, {
      rateCount: allRateInfos.length,
      hasMediaItems: mediaItems.length > 0,
      mediaItemCount: mediaItems.length,
      firstRate: allRateInfos[0]
    });

    const roomTypes: RoomType[] = allRateInfos.map((rate: any) => ({
      roomType: rate.RoomType || rate.RoomDescription || 'Standard Room',
      description: rate.Text || '',
      rateCode: rate.RateCode || '',
      amountBeforeTax: parseFloat(rate.AmountBeforeTax) || 0,
      amountAfterTax: parseFloat(rate.AmountAfterTax) || 0,
      currencyCode: rate.CurrencyCode || 'USD',
      bedType: rate.BedType || '',
      maxOccupancy: parseInt(rate.MaxOccupancy) || 2,
      guarantee: rate.GuaranteeType || '',
      cancellation: rate.CancelPenalty || 'See policy',
    }));

    // Calculate price ranges from all room types
    const validPrices = roomTypes
      .map(r => r.amountAfterTax)
      .filter(price => price > 0);
    const lowestRate = validPrices.length > 0 ? Math.min(...validPrices) : undefined;
    const highestRate = validPrices.length > 0 ? Math.max(...validPrices) : undefined;

    // Extract hero image using smart filtering (avoids maps, prefers JPG)
    const heroImage = getHeroImage(hotelInfo);

    // Extract all available images from MediaItems
    const allImages = mediaItems
      .filter((item: any) => item.Url && item.Format !== 'Map')
      .map((item: any) => item.Url);

    // Extract amenities
    const amenitiesArray = hotelInfo.Amenities?.Amenity || [];
    const amenities = amenitiesArray.map((amenity: any) => ({
      code: amenity.Code || '',
      description: amenity.Description || '',
    }));

    return {
      hotelCode: hotelInfo.HotelCode || '',
      hotelName: hotelInfo.HotelName || 'Unknown Hotel',
      chainCode: hotelInfo.ChainCode,
      chainName: hotelInfo.ChainName,
      starRating: parseFloat(hotelInfo.SabreRating || hotelInfo.PropertyQualityInfo?.PropertyQuality?.NTMStarRating),
      address: {
        addressLine1: address.AddressLine1,
        city: address.CityName,
        state: address.StateProv,
        postalCode: address.PostalCode,
        country: address.CountryCode,
      },
      coordinates: geoCoords.Latitude && geoCoords.Longitude
        ? {
            latitude: parseFloat(geoCoords.Latitude),
            longitude: parseFloat(geoCoords.Longitude),
          }
        : undefined,
      lowestRate,
      highestRate,
      currencyCode: roomTypes[0]?.currencyCode || 'USD',
      rateCount: roomTypes.length,
      thumbnail: heroImage,
      images: allImages.length > 0 ? allImages : [heroImage],
      amenities,
      distance: hotel.Distance ? parseFloat(hotel.Distance) : undefined,
      roomTypes, // ALL available room types and rates
    };
  });
}

/**
 * Search for hotels using Sabre GeoSearch API
 */
export async function searchHotels(params: HotelSearchParams): Promise<HotelSearchResult[]> {
  try {
    // Get authentication token
    const token = await getAuthToken();
    const baseUrl = getApiBaseUrl();

    // Build search payload
    const payload = buildSearchPayload(params);

    console.log('Sabre hotel search payload:', JSON.stringify(payload, null, 2));

    // Call Sabre API
    const response = await fetch(`${baseUrl}/v5/get/hotelavail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
      },
      body: JSON.stringify(payload),
    });

    console.log(`Sabre API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Sabre hotel search error:');
      console.error('Status:', response.status);
      console.error('Response body:', errorText);

      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Could not parse error as JSON');
      }

      throw new Error(`Hotel search failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    console.log('✅ Sabre hotel search response received');

    // DEBUG: Log RAW Sabre response structure for first hotel
    const firstHotel = data?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo?.[0];
    if (firstHotel) {
      console.log('🔍 RAW First Hotel from Sabre:', JSON.stringify(firstHotel, null, 2));
      console.log('🔍 HotelRateInfo structure:', firstHotel.HotelRateInfo);
      console.log('🔍 RateInfos:', firstHotel.HotelRateInfo?.RateInfos);
      console.log('🔍 RateInfo array:', firstHotel.HotelRateInfo?.RateInfos?.RateInfo);
    }

    // Parse and return results
    const hotels = parseHotelResults(data);
    console.log(`Found ${hotels.length} hotels`);

    return hotels;
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}
