/**
 * Hotel Search API Route with Luxury Enrichment
 *
 * This is an example integration showing how to use the hotel enrichment service.
 * It intercepts Sabre API results and adds luxury program data before returning to frontend.
 *
 * INTEGRATION PATTERN:
 * 1. Get raw results from Sabre API
 * 2. Enrich with luxury program data (before caching!)
 * 3. Cache enriched results
 * 4. Return to frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, HotelSearchResult } from '@/lib/sabre/search';
import { enrichHotelResults, type EnrichedHotelResult } from '@/lib/services/hotel-enricher';
import { Location } from '@/types/location';
import { cache, generateSearchCacheKey, CACHE_TTL } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, checkIn, checkOut, rooms, adults, children, radius } = body;

    // Validation
    if (!location || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Missing required fields: location, checkIn, checkOut' },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return NextResponse.json(
        { error: 'Check-in date must be in the future' },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { error: 'Check-out date must be after check-in date' },
        { status: 400 }
      );
    }

    // Perform search
    const searchParams = {
      location: location as Location,
      checkIn,
      checkOut,
      rooms: rooms || 1,
      adults: adults || 2,
      children: children || 0,
      radius: radius || 20,
    };

    // Check cache first (cache enriched results!)
    const cacheKey = generateSearchCacheKey(searchParams);
    const cachedResults = cache.get<EnrichedHotelResult[]>(cacheKey);

    if (cachedResults) {
      console.log('✅ Returning cached search results for:', cacheKey);

      // Calculate luxury stats from cache
      const luxuryCount = cachedResults.filter((h) => h.isLuxury).length;

      return NextResponse.json({
        success: true,
        results: cachedResults,
        count: cachedResults.length,
        luxuryCount,
        cached: true,
        searchParams: {
          destination: location.name,
          checkIn,
          checkOut,
          rooms: searchParams.rooms,
          adults: searchParams.adults,
          children: searchParams.children,
        },
      });
    }

    // Cache miss - perform fresh search
    console.log('⏳ Cache miss - fetching fresh results for:', cacheKey);
    const rawResults = await searchHotels(searchParams);

    // 🌟 ENRICHMENT STEP: Add luxury program data
    // This is where the magic happens - we intercept raw Sabre results
    // and add luxury program information before sending to frontend
    const enrichedResults = enrichHotelResults(rawResults);

    // Store ENRICHED results in cache (not raw results!)
    cache.set(cacheKey, enrichedResults, CACHE_TTL.SEARCH_RESULTS);

    // Calculate luxury stats
    const luxuryCount = enrichedResults.filter((h) => h.isLuxury).length;
    const luxuryPercentage = ((luxuryCount / enrichedResults.length) * 100).toFixed(1);

    console.log(`✨ Enriched ${enrichedResults.length} hotels:`);
    console.log(`   - ${luxuryCount} luxury properties (${luxuryPercentage}%)`);

    // TODO: Store search in database (SearchLog model)
    // await prisma.searchLog.create({
    //   data: {
    //     location: location.name,
    //     checkIn,
    //     checkOut,
    //     resultsCount: enrichedResults.length,
    //     luxuryCount,
    //   }
    // });

    return NextResponse.json({
      success: true,
      results: enrichedResults,
      count: enrichedResults.length,
      luxuryCount,
      cached: false,
      searchParams: {
        destination: location.name,
        checkIn,
        checkOut,
        rooms: searchParams.rooms,
        adults: searchParams.adults,
        children: searchParams.children,
      },
    });
  } catch (error) {
    console.error('Hotel search API error:', error);
    return NextResponse.json(
      {
        error: 'Hotel search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * USAGE IN FRONTEND:
 *
 * ```tsx
 * // components/HotelCard.tsx
 * import { LuxuryBadgeGroup } from '@/components/hotel/LuxuryBadge';
 * import { EnrichedHotelResult } from '@/lib/services/hotel-enricher';
 *
 * function HotelCard({ hotel }: { hotel: EnrichedHotelResult }) {
 *   return (
 *     <div className="hotel-card">
 *       <h3>{hotel.name}</h3>
 *
 *       {hotel.isLuxury && (
 *         <LuxuryBadgeGroup
 *           programs={hotel.luxuryPrograms}
 *           size="md"
 *           animated
 *         />
 *       )}
 *
 *       <p className="price">${hotel.minRate}</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * PERFORMANCE NOTES:
 * - Enrichment adds ~0.1ms per hotel (O(1) Map/Set lookups)
 * - For 100 hotels: ~10ms overhead
 * - Enriched results are cached, so enrichment only happens once per search
 * - Cache TTL: 10 minutes (CACHE_TTL.SEARCH_RESULTS)
 *
 * EXPANDING THE KNOWLEDGE BASE:
 * 1. Add more chain codes to CHAIN_PROGRAMS in luxury-mapping.ts
 * 2. Add more hotel IDs to VIRTUOSO_HOTEL_IDS (scrape from virtuoso.com)
 * 3. Create new luxury programs by extending LuxuryProgram type
 * 4. Update LUXURY_PROGRAM_INFO with display metadata
 */
