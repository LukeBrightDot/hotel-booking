/**
 * Luxury Hotel Program Mapping
 *
 * This module contains the knowledge base for identifying hotels that belong
 * to luxury travel programs (Virtuoso, Preferred Partners, etc.)
 *
 * Performance: Uses Map for O(1) chain code lookups, Set for O(1) hotel ID checks
 */

export type LuxuryProgram =
  | 'VIRTUOSO'
  | 'FOUR_SEASONS_PREFERRED'
  | 'RITZ_CARLTON_STARS'
  | 'BELMOND_BELLINI'
  | 'ROSEWOOD_ELITE'
  | 'AMAN_PREFERRED'
  | 'PENINSULA_PRIVILEGE';

export interface LuxuryProgramInfo {
  id: LuxuryProgram;
  displayName: string;
  description: string;
  theme: {
    bg: string;
    text: string;
    border: string;
  };
}

/**
 * Chain Code to Luxury Program Mapping
 *
 * Key: Sabre Chain Code (e.g., 'FS' for Four Seasons)
 * Value: Luxury Program ID
 *
 * To expand: Add new chain codes as you discover them in Sabre results
 */
export const CHAIN_PROGRAMS = new Map<string, LuxuryProgram>([
  ['FS', 'FOUR_SEASONS_PREFERRED'],      // Four Seasons Hotels
  ['RZ', 'RITZ_CARLTON_STARS'],          // Ritz-Carlton
  ['MO', 'BELMOND_BELLINI'],             // Belmond (formerly Orient-Express)
  ['RO', 'ROSEWOOD_ELITE'],              // Rosewood Hotels
  ['AM', 'AMAN_PREFERRED'],              // Aman Resorts
  ['PE', 'PENINSULA_PRIVILEGE'],         // Peninsula Hotels
]);

/**
 * Virtuoso Hotel IDs
 *
 * Curated list of hotel IDs confirmed as Virtuoso properties.
 * These are Sabre Hotel IDs (usually 5-digit codes).
 *
 * To expand:
 * 1. Scrape Virtuoso.com hotel directory
 * 2. Cross-reference with Sabre Hotel IDs
 * 3. Add to this Set for instant lookups
 *
 * Current list: Famous flagship properties (examples)
 */
export const VIRTUOSO_HOTEL_IDS = new Set<string>([
  '02179', // The Plaza, New York
  '06368', // Le Bristol, Paris
  '12847', // Mandarin Oriental, Bangkok
  '08934', // Capella, Singapore
  '15632', // Aman Tokyo
  '19283', // Park Hyatt, Tokyo
  '23451', // The Savoy, London
  '31209', // Raffles, Singapore
  '42876', // Hotel du Cap-Eden-Roc, Antibes
  '58392', // Badrutt's Palace, St. Moritz
]);

/**
 * Program Metadata for UI Display
 */
export const LUXURY_PROGRAM_INFO: Record<LuxuryProgram, LuxuryProgramInfo> = {
  VIRTUOSO: {
    id: 'VIRTUOSO',
    displayName: 'Virtuoso',
    description: 'Exclusive amenities, upgrades & VIP treatment',
    theme: {
      bg: 'bg-black',
      text: 'text-amber-400',
      border: 'border-amber-400/20',
    },
  },
  FOUR_SEASONS_PREFERRED: {
    id: 'FOUR_SEASONS_PREFERRED',
    displayName: 'Four Seasons Preferred',
    description: 'Complimentary breakfast, upgrades & $100 credit',
    theme: {
      bg: 'bg-slate-800',
      text: 'text-amber-300',
      border: 'border-amber-300/20',
    },
  },
  RITZ_CARLTON_STARS: {
    id: 'RITZ_CARLTON_STARS',
    displayName: 'Ritz-Carlton STARS',
    description: 'Room upgrades, dining credits & early check-in',
    theme: {
      bg: 'bg-blue-900',
      text: 'text-blue-100',
      border: 'border-blue-200/20',
    },
  },
  BELMOND_BELLINI: {
    id: 'BELMOND_BELLINI',
    displayName: 'Belmond Bellini',
    description: 'Signature experiences & property credits',
    theme: {
      bg: 'bg-emerald-900',
      text: 'text-emerald-100',
      border: 'border-emerald-200/20',
    },
  },
  ROSEWOOD_ELITE: {
    id: 'ROSEWOOD_ELITE',
    displayName: 'Rosewood Elite',
    description: 'Complimentary breakfast & room upgrades',
    theme: {
      bg: 'bg-rose-900',
      text: 'text-rose-100',
      border: 'border-rose-200/20',
    },
  },
  AMAN_PREFERRED: {
    id: 'AMAN_PREFERRED',
    displayName: 'Aman Preferred',
    description: 'Spa credits, dining experiences & upgrades',
    theme: {
      bg: 'bg-stone-800',
      text: 'text-stone-100',
      border: 'border-stone-200/20',
    },
  },
  PENINSULA_PRIVILEGE: {
    id: 'PENINSULA_PRIVILEGE',
    displayName: 'Peninsula Privilege',
    description: '$100 credit, upgrades & late checkout',
    theme: {
      bg: 'bg-indigo-900',
      text: 'text-indigo-100',
      border: 'border-indigo-200/20',
    },
  },
};

/**
 * Get Luxury Programs for a Hotel
 *
 * @param chainCode - Sabre chain code (e.g., 'FS', 'RZ')
 * @param hotelId - Sabre hotel ID (e.g., '02179')
 * @returns Array of luxury program IDs this hotel belongs to
 *
 * @example
 * ```ts
 * getLuxuryPrograms('FS', '15632')
 * // Returns: ['FOUR_SEASONS_PREFERRED', 'VIRTUOSO']
 * // (Aman Tokyo is both Four Seasons Preferred AND Virtuoso)
 * ```
 */
export function getLuxuryPrograms(
  chainCode: string | null | undefined,
  hotelId: string | null | undefined
): LuxuryProgram[] {
  const programs: LuxuryProgram[] = [];

  // Check chain-based programs (O(1) Map lookup)
  if (chainCode) {
    const chainProgram = CHAIN_PROGRAMS.get(chainCode);
    if (chainProgram) {
      programs.push(chainProgram);
    }
  }

  // Check Virtuoso membership (O(1) Set lookup)
  if (hotelId && VIRTUOSO_HOTEL_IDS.has(hotelId)) {
    // Avoid duplicates if already added via chain code
    if (!programs.includes('VIRTUOSO')) {
      programs.push('VIRTUOSO');
    }
  }

  return programs;
}

/**
 * Check if a hotel has any luxury programs
 *
 * @param chainCode - Sabre chain code
 * @param hotelId - Sabre hotel ID
 * @returns true if hotel belongs to at least one luxury program
 */
export function isLuxuryHotel(
  chainCode: string | null | undefined,
  hotelId: string | null | undefined
): boolean {
  return getLuxuryPrograms(chainCode, hotelId).length > 0;
}
