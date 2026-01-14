import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, HotelSearchResult } from '@/lib/sabre/search';
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

    // Check cache first
    const cacheKey = generateSearchCacheKey(searchParams);
    const cachedResults = cache.get<HotelSearchResult[]>(cacheKey);

    if (cachedResults) {
      console.log('✅ Returning cached search results for:', cacheKey);
      return NextResponse.json({
        success: true,
        results: cachedResults,
        count: cachedResults.length,
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
    const results = await searchHotels(searchParams);

    // Store in cache for 10 minutes
    cache.set(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);

    // TODO: Store search in database (SearchLog model)
    // await prisma.searchLog.create({ ... });

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
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
