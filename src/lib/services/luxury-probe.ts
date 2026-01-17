/**
 * Luxury Rate Probe Service
 *
 * Validates luxury program availability by ACTUALLY querying Sabre API.
 *
 * The Problem:
 * - Just because a hotel is named "Four Seasons" doesn't mean it participates
 * - Your PCC might not have access
 * - The property might be franchised and opted out
 *
 * The Solution:
 * - Test by requesting the actual luxury rate code (FSP, VIR, S72, etc.)
 * - If Sabre returns that rate → CONFIRMED
 * - If Sabre returns only standard rates → REJECTED
 *
 * This turns hypothesis into proof.
 */

import { addDays, format } from 'date-fns';
import { getSabreToken } from '../sabre/auth';

interface ProbeResult {
  isConfirmed: boolean;
  rateCodeFound: string | null;
  rateAmount?: number;
  currency?: string;
  benefitsDetected: string[];
  error?: string;
}

export interface ProbeConfig {
  hotelId: string;
  chainCode: string;
  daysInFuture?: number; // How far out to test (default: 45)
  nightCount?: number; // Length of stay (default: 2)
}

/**
 * Rate Code Mappings
 *
 * Maps chain codes to their luxury program rate codes.
 * These are the codes we'll "probe" for to validate participation.
 */
const LUXURY_RATE_CODES: Record<string, string[]> = {
  // Four Seasons Preferred Partner
  FS: ['FSP', 'FPP'],

  // Ritz-Carlton / St. Regis (Marriott STARS)
  RZ: ['S72', 'STR', 'MBS'],
  XR: ['S72', 'STR', 'MBS'], // St. Regis
  BG: ['S72', 'STR', 'MBS'], // Bulgari
  ED: ['S72', 'STR', 'MBS'], // Edition

  // Mandarin Oriental
  MO: ['MOF', 'FAN'],

  // Rosewood Elite
  RW: ['RWE', 'RWP'],

  // Aman
  AM: ['AMA', 'AMP'],

  // Peninsula Privilege
  PE: ['PEN', 'PPP'],

  // Hyatt (Park Hyatt, Andaz - Prive)
  HY: ['P12', 'PRI'],
  PH: ['P12', 'PRI'], // Park Hyatt
  AZ: ['P12', 'PRI'], // Andaz

  // Virtuoso (fallback for independents & luxury brands)
  DEFAULT: ['VIR', 'VRT', 'VTU'],
};

/**
 * Probe a Hotel for Luxury Rate Availability
 *
 * Makes a real API call to Sabre to check if luxury rates are available.
 *
 * @param config - Hotel and test configuration
 * @returns Validation result with confirmation status
 *
 * @example
 * ```ts
 * const result = await probeLuxuryRate({
 *   hotelId: '12345',
 *   chainCode: 'FS'
 * });
 *
 * if (result.isConfirmed) {
 *   console.log(`✅ Hotel supports ${result.rateCodeFound}`);
 * }
 * ```
 */
export async function probeLuxuryRate(
  config: ProbeConfig
): Promise<ProbeResult> {
  const {
    hotelId,
    chainCode,
    daysInFuture = 45,
    nightCount = 2,
  } = config;

  // Step 1: Determine which rate codes to test
  const codesToTest = [
    ...(LUXURY_RATE_CODES[chainCode] || []),
    ...LUXURY_RATE_CODES.DEFAULT, // Always test Virtuoso
  ];

  // Remove duplicates
  const uniqueCodes = Array.from(new Set(codesToTest));

  // Step 2: Calculate test dates (far enough out to have inventory)
  const checkIn = addDays(new Date(), daysInFuture);
  const checkOut = addDays(checkIn, nightCount);

  console.log(
    `🔍 Probing hotel ${hotelId} (${chainCode}) for codes: ${uniqueCodes.join(', ')}`
  );

  try {
    // Step 3: Get Sabre authentication token
    const token = await getSabreToken();

    // Step 4: Build Sabre Hotel Availability Request
    const payload = {
      GetHotelAvailRQ: {
        SearchCriteria: {
          HotelRefs: {
            HotelRef: [{ HotelCode: hotelId }],
          },
          RatePlanCandidates: {
            RatePlanCandidate: uniqueCodes.map((code) => ({
              RatePlanCode: code,
            })),
            // CRITICAL: Allow Sabre to return other rates if luxury codes unavailable
            ExactMatchOnly: false,
          },
          StayDateRange: {
            StartDate: format(checkIn, 'yyyy-MM-dd'),
            EndDate: format(checkOut, 'yyyy-MM-dd'),
          },
          NumRooms: 1,
        },
      },
    };

    // Step 5: Make the API call
    const response = await fetch(
      'https://api.sabre.com/v3.0.0/hotel/availability',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Probe failed: ${response.status} - ${errorText}`);
      return {
        isConfirmed: false,
        rateCodeFound: null,
        benefitsDetected: [],
        error: `API Error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Step 6: Analyze response
    const hotelInfo =
      data?.GetHotelAvailRS?.HotelAvailInfos?.HotelAvailInfo?.[0];
    const ratePlans = hotelInfo?.RatePlans?.RatePlan || [];

    // Step 7: Check if any luxury rate codes were returned
    for (const plan of ratePlans) {
      const returnedCode = plan.RatePlanCode;

      // Match against our luxury codes
      if (uniqueCodes.includes(returnedCode)) {
        // SUCCESS! Found a luxury rate
        const amount = plan.RatePlanRate?.AmountBeforeTax;
        const currency = plan.RatePlanRate?.CurrencyCode;
        const description = plan.RatePlanDescription?.Text || '';

        console.log(`✅ CONFIRMED: Hotel ${hotelId} returned rate code ${returnedCode}`);

        return {
          isConfirmed: true,
          rateCodeFound: returnedCode,
          rateAmount: amount ? parseFloat(amount) : undefined,
          currency,
          benefitsDetected: extractBenefits(description),
        };
      }
    }

    // Step 8: No luxury codes found
    console.log(
      `❌ REJECTED: Hotel ${hotelId} only returned standard rates: ${ratePlans
        .map((p: any) => p.RatePlanCode)
        .join(', ')}`
    );

    return {
      isConfirmed: false,
      rateCodeFound: null,
      benefitsDetected: [],
    };
  } catch (error) {
    console.error(`❌ Probe error for hotel ${hotelId}:`, error);
    return {
      isConfirmed: false,
      rateCodeFound: null,
      benefitsDetected: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch Probe Multiple Hotels
 *
 * Tests multiple hotels with rate limiting to avoid API throttling.
 *
 * @param hotels - Array of hotel configurations to test
 * @param delayMs - Delay between each probe (default: 1000ms)
 * @returns Array of probe results
 */
export async function probeLuxuryRateBatch(
  hotels: ProbeConfig[],
  delayMs: number = 1000
): Promise<Map<string, ProbeResult>> {
  const results = new Map<string, ProbeResult>();

  console.log(`\n🔬 Batch probing ${hotels.length} hotels...`);
  console.log(`   Rate limit: ${delayMs}ms between requests\n`);

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i];
    console.log(`[${i + 1}/${hotels.length}] Testing ${hotel.hotelId}...`);

    const result = await probeLuxuryRate(hotel);
    results.set(hotel.hotelId, result);

    // Rate limiting
    if (i < hotels.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // Summary
  const confirmed = Array.from(results.values()).filter((r) => r.isConfirmed)
    .length;
  const rejected = results.size - confirmed;

  console.log(`\n📊 Batch Results:`);
  console.log(`   ✅ Confirmed: ${confirmed}`);
  console.log(`   ❌ Rejected: ${rejected}`);
  console.log(`   Total: ${results.size}\n`);

  return results;
}

/**
 * Extract Benefits from Rate Description
 *
 * Parses rate description text to identify included benefits.
 *
 * @param description - Rate description from Sabre
 * @returns Array of detected benefits
 */
function extractBenefits(description: string): string[] {
  if (!description) return [];

  const benefits: string[] = [];
  const lower = description.toLowerCase();

  // Common luxury program benefits
  if (lower.match(/breakfast|bkfst|morning meal/i)) {
    benefits.push('BREAKFAST');
  }
  if (lower.match(/credit|\$\d+|usd\s*\d+/i)) {
    benefits.push('CREDIT');
  }
  if (lower.match(/upgrade|room category/i)) {
    benefits.push('UPGRADE');
  }
  if (lower.match(/late checkout|late check-out/i)) {
    benefits.push('LATE_CHECKOUT');
  }
  if (lower.match(/early checkin|early check-in/i)) {
    benefits.push('EARLY_CHECKIN');
  }
  if (lower.match(/spa|wellness/i)) {
    benefits.push('SPA_CREDIT');
  }
  if (lower.match(/vip|welcome|amenity/i)) {
    benefits.push('VIP_AMENITY');
  }

  return benefits;
}

/**
 * Check if a Hotel ID is Already Validated
 *
 * Prevents re-probing hotels we've already tested.
 * Uses a simple in-memory cache (could be upgraded to file/DB).
 */
const validatedCache = new Map<string, ProbeResult>();

export function isAlreadyValidated(hotelId: string): boolean {
  return validatedCache.has(hotelId);
}

export function getValidationResult(hotelId: string): ProbeResult | null {
  return validatedCache.get(hotelId) || null;
}

export function cacheValidationResult(
  hotelId: string,
  result: ProbeResult
): void {
  validatedCache.set(hotelId, result);
}

/**
 * Export Rate Code Mappings for Reference
 */
export { LUXURY_RATE_CODES };
