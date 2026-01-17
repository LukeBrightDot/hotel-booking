/**
 * Search Result Logger
 *
 * Logs all hotel searches to the database for:
 * - Analytics (popular destinations, search patterns)
 * - Debugging (review historical searches)
 * - Luxury hotel tracking (monitor appearance rates)
 * - Performance monitoring (response times)
 */

import { prisma } from '@/lib/prisma';
import { type EnrichedHotelResult } from './hotel-enricher';
import { type Location } from '@/types/location';

export interface SearchLogParams {
  sessionId: string;
  location: Location;
  checkIn: string;
  checkOut: string;
  rooms: number;
  adults: number;
  children: number;
  results: EnrichedHotelResult[];
  responseTime: number;
  cached: boolean;
}

/**
 * Generate a session ID from request headers
 */
export function generateSessionId(headers: Headers): string {
  // Try to get existing session from cookie
  const cookies = headers.get('cookie');
  if (cookies) {
    const sessionMatch = cookies.match(/session_id=([^;]+)/);
    if (sessionMatch) {
      return sessionMatch[1];
    }
  }

  // Generate new session ID
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Log search to database
 *
 * @param params - Search parameters and results
 * @returns Search log ID
 */
export async function logSearch(params: SearchLogParams): Promise<string | null> {
  try {
    const {
      sessionId,
      location,
      checkIn,
      checkOut,
      rooms,
      adults,
      children,
      results,
      responseTime,
      cached,
    } = params;

    // Calculate luxury stats
    const luxuryCount = results.filter((r) => r.isLuxury).length;
    const luxuryPercentage = results.length > 0 ? (luxuryCount / results.length) * 100 : 0;

    // Create search log with all hotel results
    const searchLog = await prisma.searchLog.create({
      data: {
        sessionId,
        searchParams: {
          location,
          checkIn,
          checkOut,
          rooms,
          adults,
          children,
          radius: 20,
          cached,
          luxuryCount,
          luxuryPercentage: Math.round(luxuryPercentage),
        },
        destination: location.name,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        rooms,
        adults,
        children,
        resultsCount: results.length,
        responseTime,
        status: 'success',
        results: {
          create: results.map((hotel) => ({
            hotelCode: hotel.hotelCode,
            hotelName: hotel.hotelName,
            chainCode: hotel.chainCode || null,
            chainName: hotel.chainName || null,
            starRating: hotel.starRating || null,
            address: {
              line1: hotel.address?.line1 || '',
              line2: hotel.address?.line2 || '',
              city: hotel.address?.city || location.city || '',
              state: hotel.address?.state || '',
              postalCode: hotel.address?.postalCode || '',
              country: hotel.address?.country || location.country || '',
            },
            city: String(hotel.address?.city || location.city || ''),
            country: String(hotel.address?.country || location.country || ''),
            coordinates: hotel.coordinates
              ? {
                  lat: hotel.coordinates.lat,
                  lng: hotel.coordinates.lng,
                }
              : null,
            lowestRate: hotel.lowestRate || null,
            highestRate: hotel.highestRate || null,
            currencyCode: hotel.currencyCode || null,
            rateCount: hotel.rates?.length || 0,
            amenities: hotel.amenities || [],
            images: hotel.images || [],
            thumbnail: hotel.thumbnail || null,
          })),
        },
      },
    });

    console.log(`📊 Search logged: ${searchLog.id} (${results.length} hotels, ${luxuryCount} luxury)`);

    return searchLog.id;
  } catch (error) {
    console.error('❌ Failed to log search to database:', error);
    // Don't throw - logging failure shouldn't break search
    return null;
  }
}

/**
 * Log failed search
 *
 * @param params - Search parameters
 * @param error - Error that occurred
 * @returns Search log ID
 */
export async function logFailedSearch(
  sessionId: string,
  location: Location,
  checkIn: string,
  checkOut: string,
  rooms: number,
  adults: number,
  children: number,
  error: Error,
  responseTime: number
): Promise<string | null> {
  try {
    const searchLog = await prisma.searchLog.create({
      data: {
        sessionId,
        searchParams: {
          location,
          checkIn,
          checkOut,
          rooms,
          adults,
          children,
        },
        destination: location.name,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        rooms,
        adults,
        children,
        resultsCount: 0,
        responseTime,
        status: 'error',
        errorMessage: error.message,
      },
    });

    console.log(`❌ Failed search logged: ${searchLog.id} - ${error.message}`);

    return searchLog.id;
  } catch (logError) {
    console.error('❌ Failed to log error to database:', logError);
    return null;
  }
}

/**
 * Get search statistics
 *
 * @param days - Number of days to look back (default: 30)
 * @returns Search statistics
 */
export async function getSearchStats(days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalSearches, successfulSearches, failedSearches, topDestinations] =
      await Promise.all([
        // Total searches
        prisma.searchLog.count({
          where: { createdAt: { gte: since } },
        }),

        // Successful searches
        prisma.searchLog.count({
          where: {
            createdAt: { gte: since },
            status: 'success',
          },
        }),

        // Failed searches
        prisma.searchLog.count({
          where: {
            createdAt: { gte: since },
            status: 'error',
          },
        }),

        // Top destinations
        prisma.searchLog.groupBy({
          by: ['destination'],
          where: { createdAt: { gte: since } },
          _count: { destination: true },
          orderBy: { _count: { destination: 'desc' } },
          take: 10,
        }),
      ]);

    const successRate =
      totalSearches > 0 ? (successfulSearches / totalSearches) * 100 : 0;

    return {
      totalSearches,
      successfulSearches,
      failedSearches,
      successRate: Math.round(successRate * 100) / 100,
      topDestinations: topDestinations.map((d) => ({
        destination: d.destination,
        count: d._count.destination,
      })),
    };
  } catch (error) {
    console.error('❌ Failed to get search stats:', error);
    return null;
  }
}

/**
 * Get luxury hotel appearance statistics
 *
 * @param days - Number of days to look back (default: 30)
 * @returns Luxury hotel statistics
 */
export async function getLuxuryStats(days: number = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all search logs with luxury data
    const searches = await prisma.searchLog.findMany({
      where: {
        createdAt: { gte: since },
        status: 'success',
      },
      select: {
        searchParams: true,
        resultsCount: true,
      },
    });

    let totalHotels = 0;
    let totalLuxuryHotels = 0;

    searches.forEach((search) => {
      const params = search.searchParams as any;
      totalHotels += search.resultsCount || 0;
      totalLuxuryHotels += params.luxuryCount || 0;
    });

    const luxuryAppearanceRate =
      totalHotels > 0 ? (totalLuxuryHotels / totalHotels) * 100 : 0;

    return {
      totalHotels,
      totalLuxuryHotels,
      luxuryAppearanceRate: Math.round(luxuryAppearanceRate * 100) / 100,
      averageLuxuryPerSearch:
        searches.length > 0 ? totalLuxuryHotels / searches.length : 0,
    };
  } catch (error) {
    console.error('❌ Failed to get luxury stats:', error);
    return null;
  }
}
