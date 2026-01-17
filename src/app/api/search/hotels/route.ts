import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, HotelSearchResult } from '@/lib/sabre/search';
import { enrichHotelResults, type EnrichedHotelResult } from '@/lib/services/hotel-enricher';
import { Location } from '@/types/location';
import { cache, generateSearchCacheKey, CACHE_TTL } from '@/lib/cache';
import { logSearch, logFailedSearch, generateSessionId } from '@/lib/services/search-logger';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const sessionId = generateSessionId(request.headers);
  let body: any;

  try {
    body = await request.json();
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

    // Check cache first
    const cacheKey = generateSearchCacheKey(searchParams);
    const cachedResults = cache.get<EnrichedHotelResult[]>(cacheKey);

    if (cachedResults) {
      console.log('✅ Returning cached search results for:', cacheKey);
      const luxuryCount = cachedResults.filter((h) => h.isLuxury).length;
      const responseTime = Date.now() - startTime;

      // Log cached search to database
      await logSearch({
        sessionId,
        location: location as Location,
        checkIn,
        checkOut,
        rooms: searchParams.rooms,
        adults: searchParams.adults,
        children: searchParams.children,
        results: cachedResults,
        responseTime,
        cached: true,
      });

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

    // ✨ Enrich results with luxury program data
    const enrichedResults = enrichHotelResults(rawResults);

    // Store ENRICHED results in cache for 10 minutes
    cache.set(cacheKey, enrichedResults, CACHE_TTL.SEARCH_RESULTS);

    // Calculate luxury stats
    const luxuryCount = enrichedResults.filter((h) => h.isLuxury).length;
    const responseTime = Date.now() - startTime;
    console.log(`✨ Enriched ${enrichedResults.length} hotels - ${luxuryCount} luxury properties (${responseTime}ms)`);

    // Log search to database
    await logSearch({
      sessionId,
      location: location as Location,
      checkIn,
      checkOut,
      rooms: searchParams.rooms,
      adults: searchParams.adults,
      children: searchParams.children,
      results: enrichedResults,
      responseTime,
      cached: false,
    });

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
    const responseTime = Date.now() - startTime;

    // Log failed search to database
    if (body?.location && body?.checkIn && body?.checkOut) {
      try {
        await logFailedSearch(
          sessionId,
          body.location as Location,
          body.checkIn,
          body.checkOut,
          body.rooms || 1,
          body.adults || 2,
          body.children || 0,
          error instanceof Error ? error : new Error('Unknown error'),
          responseTime
        );
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }
    }

    return NextResponse.json(
      {
        error: 'Hotel search failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
