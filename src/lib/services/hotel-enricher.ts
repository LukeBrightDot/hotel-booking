/**
 * Hotel Enrichment Service
 *
 * Intercepts raw Sabre API results and enriches them with luxury program data.
 * This runs on the backend before sending results to the frontend.
 *
 * Performance: O(n) where n = number of hotels (each lookup is O(1) via Map/Set)
 */

import { getLuxuryPrograms, type LuxuryProgram } from '@/lib/data/luxury-mapping';

/**
 * Enriched Hotel Result
 *
 * Extends the base Sabre hotel result with luxury program information
 */
export interface EnrichedHotelResult extends HotelResult {
  // Enriched fields (added by this service)
  luxuryPrograms: LuxuryProgram[];
  isLuxury: boolean;
}

/**
 * Base Hotel Result from Sabre API
 *
 * This should match your existing HotelResult type from Prisma/API
 */
export interface HotelResult {
  hotelCode: string;
  hotelName: string;
  chainCode?: string | null;
  [key: string]: any; // Allow any other Sabre fields
}

/**
 * Enrich Hotel Results with Luxury Program Data
 *
 * @param sabreResults - Raw hotel results from Sabre Search API
 * @returns Enriched results with luxuryPrograms and isLuxury flags
 *
 * @example
 * ```ts
 * const rawResults = await sabreSearchAPI.getHotels(...);
 * const enrichedResults = enrichHotelResults(rawResults);
 *
 * // Now each hotel has:
 * // {
 * //   ...originalFields,
 * //   luxuryPrograms: ['VIRTUOSO', 'FOUR_SEASONS_PREFERRED'],
 * //   isLuxury: true
 * // }
 * ```
 */
export function enrichHotelResults(
  sabreResults: HotelResult[]
): EnrichedHotelResult[] {
  return sabreResults.map((hotel) => {
    // Get luxury programs for this hotel (O(1) lookups)
    const luxuryPrograms = getLuxuryPrograms(
      hotel.chainCode,
      hotel.hotelCode
    );

    return {
      // Spread all original fields (preserves everything from Sabre)
      ...hotel,

      // Add enriched fields
      luxuryPrograms,
      isLuxury: luxuryPrograms.length > 0,
    };
  });
}

/**
 * Filter Hotels by Luxury Programs
 *
 * Utility to filter enriched results to only luxury properties
 *
 * @param enrichedResults - Hotels that have been enriched
 * @param programs - Optional: Filter by specific programs. If not provided, returns all luxury hotels.
 * @returns Filtered list of luxury hotels
 *
 * @example
 * ```ts
 * // Get only Virtuoso properties
 * const virtuosoHotels = filterLuxuryHotels(results, ['VIRTUOSO']);
 *
 * // Get all luxury properties
 * const allLuxury = filterLuxuryHotels(results);
 * ```
 */
export function filterLuxuryHotels(
  enrichedResults: EnrichedHotelResult[],
  programs?: LuxuryProgram[]
): EnrichedHotelResult[] {
  if (!programs || programs.length === 0) {
    // Return all luxury hotels
    return enrichedResults.filter((hotel) => hotel.isLuxury);
  }

  // Return hotels that match at least one of the specified programs
  return enrichedResults.filter((hotel) =>
    hotel.luxuryPrograms.some((program) => programs.includes(program))
  );
}

/**
 * Sort Hotels by Luxury Status
 *
 * Utility to sort hotels with luxury properties first
 *
 * @param enrichedResults - Hotels that have been enriched
 * @returns Sorted list with luxury hotels first, then by price
 */
export function sortByLuxuryStatus(
  enrichedResults: EnrichedHotelResult[]
): EnrichedHotelResult[] {
  return [...enrichedResults].sort((a, b) => {
    // Luxury hotels first
    if (a.isLuxury && !b.isLuxury) return -1;
    if (!a.isLuxury && b.isLuxury) return 1;

    // Within luxury hotels, sort by number of programs (more = better)
    if (a.isLuxury && b.isLuxury) {
      const programDiff = b.luxuryPrograms.length - a.luxuryPrograms.length;
      if (programDiff !== 0) return programDiff;
    }

    // Then by price (ascending)
    const aPrice = a.minRate || Infinity;
    const bPrice = b.minRate || Infinity;
    return aPrice - bPrice;
  });
}

/**
 * Get Luxury Statistics
 *
 * Utility to get stats about luxury properties in results
 *
 * @param enrichedResults - Hotels that have been enriched
 * @returns Statistics object
 */
export function getLuxuryStats(enrichedResults: EnrichedHotelResult[]) {
  const luxuryCount = enrichedResults.filter((h) => h.isLuxury).length;
  const programCounts = new Map<LuxuryProgram, number>();

  enrichedResults.forEach((hotel) => {
    hotel.luxuryPrograms.forEach((program) => {
      programCounts.set(program, (programCounts.get(program) || 0) + 1);
    });
  });

  return {
    total: enrichedResults.length,
    luxuryCount,
    luxuryPercentage: (luxuryCount / enrichedResults.length) * 100,
    programCounts: Object.fromEntries(programCounts),
  };
}
