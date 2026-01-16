#!/usr/bin/env tsx
/**
 * Luxury Hotel Discovery Script (with Validation)
 *
 * Two-Phase Approach:
 * 1. HYPOTHESIS: Find candidate hotels by name pattern matching
 * 2. PROOF: Validate candidates by probing for actual luxury rates
 *
 * Usage:
 *   npm run discover-luxury -- --cities "Paris,New York,Tokyo,London"
 *   npm run discover-luxury -- --skip-validation (faster, less accurate)
 *   npm run discover-luxury -- --validate-only (re-validate existing candidates)
 *
 * This script helps maintain the luxury-mapping.ts file by:
 * - Finding hotels with luxury brand names (hypothesis)
 * - Validating they actually return luxury rates (proof)
 * - Only adding CONFIRMED hotels to the database
 */

import { searchHotels } from '../src/lib/sabre/search';
import { probeLuxuryRateBatch, type ProbeConfig } from '../src/lib/services/luxury-probe';

interface ChainCodeInfo {
  code: string;
  name: string;
  count: number;
  sampleHotels: Array<{
    id: string;
    name: string;
  }>;
}

interface LuxuryBrandPattern {
  pattern: RegExp;
  program: string;
  brand: string;
}

/**
 * Luxury Brand Patterns
 *
 * These regex patterns identify luxury hotel brands by name.
 * When a hotel name matches, we can infer its luxury program membership.
 */
const LUXURY_BRAND_PATTERNS: LuxuryBrandPattern[] = [
  {
    pattern: /four seasons/i,
    program: 'FOUR_SEASONS_PREFERRED',
    brand: 'Four Seasons',
  },
  {
    pattern: /ritz-?carlton/i,
    program: 'RITZ_CARLTON_STARS',
    brand: 'Ritz-Carlton',
  },
  {
    pattern: /\baman\b/i,
    program: 'AMAN_PREFERRED',
    brand: 'Aman',
  },
  {
    pattern: /rosewood/i,
    program: 'ROSEWOOD_ELITE',
    brand: 'Rosewood',
  },
  {
    pattern: /peninsula/i,
    program: 'PENINSULA_PRIVILEGE',
    brand: 'Peninsula',
  },
  {
    pattern: /belmond/i,
    program: 'BELMOND_BELLINI',
    brand: 'Belmond',
  },
  {
    pattern: /mandarin oriental/i,
    program: 'VIRTUOSO',
    brand: 'Mandarin Oriental',
  },
  {
    pattern: /park hyatt/i,
    program: 'VIRTUOSO',
    brand: 'Park Hyatt',
  },
  {
    pattern: /andaz/i,
    program: 'VIRTUOSO',
    brand: 'Andaz',
  },
  {
    pattern: /st\.? regis|saint regis/i,
    program: 'VIRTUOSO',
    brand: 'St. Regis',
  },
  {
    pattern: /\bw hotel\b|^w\s/i,
    program: 'VIRTUOSO',
    brand: 'W Hotels',
  },
  {
    pattern: /conrad/i,
    program: 'VIRTUOSO',
    brand: 'Conrad',
  },
  {
    pattern: /waldorf astoria/i,
    program: 'VIRTUOSO',
    brand: 'Waldorf Astoria',
  },
  {
    pattern: /raffles/i,
    program: 'VIRTUOSO',
    brand: 'Raffles',
  },
  {
    pattern: /banyan tree/i,
    program: 'VIRTUOSO',
    brand: 'Banyan Tree',
  },
  {
    pattern: /six senses/i,
    program: 'VIRTUOSO',
    brand: 'Six Senses',
  },
  {
    pattern: /capella/i,
    program: 'VIRTUOSO',
    brand: 'Capella',
  },
  {
    pattern: /bulgari/i,
    program: 'VIRTUOSO',
    brand: 'Bulgari',
  },
  {
    pattern: /oberoi/i,
    program: 'VIRTUOSO',
    brand: 'Oberoi',
  },
  {
    pattern: /one\s*&\s*only/i,
    program: 'VIRTUOSO',
    brand: 'One&Only',
  },
];

/**
 * Analyze search results from multiple cities to discover patterns
 */
async function discoverLuxuryHotels(cities: string[], skipValidation = false) {
  console.log('🔍 Starting luxury hotel discovery...\n');

  const chainCodeMap = new Map<string, ChainCodeInfo>();
  const luxuryHotels = new Map<string, any>();
  let totalHotels = 0;

  // PHASE 1: HYPOTHESIS - Pattern matching to find candidates
  console.log('📋 PHASE 1: HYPOTHESIS - Pattern matching luxury brands\n');

  for (const city of cities) {
    console.log(`\n📍 Searching ${city}...`);

    try {
      const results = await searchHotels({
        location: {
          id: `${city.toLowerCase()}-city`,
          type: 'city',
          code: city.substring(0, 3).toUpperCase(),
          name: city,
          city,
          country: 'Unknown',
          countryCode: 'XX',
          lat: 0,
          lng: 0,
          searchPriority: 1,
        },
        checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        rooms: 1,
        adults: 2,
        children: 0,
        radius: 20,
      });

      console.log(`   Found ${results.length} hotels`);
      totalHotels += results.length;

      // Analyze each hotel
      for (const hotel of results) {
        const chainCode = hotel.chainCode || 'INDEPENDENT';
        const chainName = hotel.chainName || 'Independent';

        // Track chain code frequencies
        if (!chainCodeMap.has(chainCode)) {
          chainCodeMap.set(chainCode, {
            code: chainCode,
            name: chainName,
            count: 0,
            sampleHotels: [],
          });
        }

        const chainInfo = chainCodeMap.get(chainCode)!;
        chainInfo.count++;

        // Store sample hotels (up to 3 per chain)
        if (chainInfo.sampleHotels.length < 3) {
          chainInfo.sampleHotels.push({
            id: hotel.hotelCode,
            name: hotel.hotelName,
          });
        }

        // Check if hotel matches luxury brand patterns
        for (const { pattern, program, brand } of LUXURY_BRAND_PATTERNS) {
          if (pattern.test(hotel.hotelName)) {
            const key = `${hotel.hotelCode}-${program}`;
            if (!luxuryHotels.has(key)) {
              luxuryHotels.set(key, {
                hotelId: hotel.hotelCode,
                hotelName: hotel.hotelName,
                chainCode: hotel.chainCode,
                chainName: hotel.chainName,
                program,
                brand,
                city,
                validated: false,
              });
            }
          }
        }
      }

      // Avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`   ❌ Error searching ${city}:`, error instanceof Error ? error.message : error);
    }
  }

  const candidateHotels = Array.from(luxuryHotels.values());
  console.log(`\n✅ Phase 1 Complete: Found ${candidateHotels.length} candidate luxury hotels\n`);

  // PHASE 2: PROOF - Validate candidates by probing for luxury rates
  let confirmedHotels = candidateHotels;
  let validationResults = new Map<string, any>();

  if (!skipValidation && candidateHotels.length > 0) {
    console.log('🔬 PHASE 2: PROOF - Validating luxury rate availability\n');
    console.log(`   Testing ${candidateHotels.length} candidates...\n`);

    // Convert to probe configs
    const probeConfigs: ProbeConfig[] = candidateHotels.map((hotel) => ({
      hotelId: hotel.hotelId,
      chainCode: hotel.chainCode || 'INDEPENDENT',
    }));

    // Run batch validation
    validationResults = await probeLuxuryRateBatch(probeConfigs, 1500);

    // Filter to only confirmed hotels
    confirmedHotels = candidateHotels.filter((hotel) => {
      const result = validationResults.get(hotel.hotelId);
      if (result?.isConfirmed) {
        hotel.validated = true;
        hotel.rateCodeFound = result.rateCodeFound;
        hotel.benefitsDetected = result.benefitsDetected;
        return true;
      }
      return false;
    });

    const rejectedCount = candidateHotels.length - confirmedHotels.length;
    console.log(`\n✅ Phase 2 Complete:`);
    console.log(`   ✅ Confirmed: ${confirmedHotels.length}`);
    console.log(`   ❌ Rejected: ${rejectedCount}`);
    console.log(`   📊 Success Rate: ${Math.round((confirmedHotels.length / candidateHotels.length) * 100)}%\n`);
  } else if (skipValidation) {
    console.log('⚠️  PHASE 2: SKIPPED - Validation disabled\n');
  }

  return {
    chainCodes: Array.from(chainCodeMap.values()).sort((a, b) => b.count - a.count),
    luxuryHotels: confirmedHotels,
    candidateHotels: candidateHotels.length,
    confirmedHotels: confirmedHotels.length,
    validationResults,
    totalHotels,
  };
}

/**
 * Generate TypeScript code for luxury-mapping.ts
 */
function generateMappingCode(
  chainCodes: ChainCodeInfo[],
  luxuryHotels: any[]
): string {
  // Group luxury hotels by program
  const programChains = new Map<string, Set<string>>();
  const hotelIdsByProgram = new Map<string, Set<string>>();

  luxuryHotels.forEach((hotel) => {
    // Chain code mappings
    if (hotel.chainCode && hotel.chainCode !== 'INDEPENDENT') {
      if (!programChains.has(hotel.program)) {
        programChains.set(hotel.program, new Set());
      }
      programChains.get(hotel.program)!.add(hotel.chainCode);
    }

    // Hotel ID mappings (especially for Virtuoso)
    if (!hotelIdsByProgram.has(hotel.program)) {
      hotelIdsByProgram.set(hotel.program, new Set());
    }
    hotelIdsByProgram.get(hotel.program)!.add(hotel.hotelId);
  });

  let code = '// Auto-generated chain code mappings\n';
  code += '// Generated: ' + new Date().toISOString() + '\n\n';

  code += 'export const DISCOVERED_CHAIN_PROGRAMS = new Map<string, LuxuryProgram>([\n';
  programChains.forEach((chains, program) => {
    chains.forEach((chain) => {
      code += `  ['${chain}', '${program}'],\n`;
    });
  });
  code += ']);\n\n';

  code += '// Discovered Virtuoso hotel IDs\n';
  code += 'export const DISCOVERED_VIRTUOSO_HOTELS = new Set<string>([\n';
  const virtuosoIds = hotelIdsByProgram.get('VIRTUOSO') || new Set();
  virtuosoIds.forEach((id) => {
    code += `  '${id}',\n`;
  });
  code += ']);\n';

  return code;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const citiesArg = args.find((arg) => arg.startsWith('--cities='));
  const skipValidation = args.includes('--skip-validation');
  const validateOnly = args.includes('--validate-only');

  let cities = ['Paris', 'New York', 'Tokyo', 'London', 'Dubai'];

  if (citiesArg) {
    cities = citiesArg.split('=')[1].split(',').map((c) => c.trim());
  }

  console.log('🏨 Luxury Hotel Discovery Tool\n');
  console.log(`Cities to analyze: ${cities.join(', ')}`);
  console.log(`Validation: ${skipValidation ? 'DISABLED' : 'ENABLED'}\n`);

  const { chainCodes, luxuryHotels, totalHotels, candidateHotels, confirmedHotels, validationResults } =
    await discoverLuxuryHotels(cities, skipValidation);

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('📊 DISCOVERY RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log(`Total hotels analyzed: ${totalHotels}`);
  console.log(`Unique chain codes: ${chainCodes.length}`);

  if (!skipValidation) {
    console.log(`Candidate hotels (pattern match): ${candidateHotels}`);
    console.log(`✅ Confirmed hotels (validated): ${confirmedHotels}`);
    console.log(`❌ Rejected hotels: ${candidateHotels - confirmedHotels}\n`);
  } else {
    console.log(`Luxury hotels found (unvalidated): ${luxuryHotels.length}\n`);
  }

  console.log('🏢 Top Chain Codes (by frequency):\n');
  chainCodes.slice(0, 20).forEach((chain, index) => {
    console.log(`${(index + 1).toString().padStart(2)}. ${chain.code.padEnd(10)} (${chain.count.toString().padStart(3)}x) ${chain.name}`);
    if (chain.sampleHotels.length > 0) {
      console.log(`    Sample: ${chain.sampleHotels[0].name}`);
    }
  });

  console.log(`\n✨ ${skipValidation ? 'Discovered' : 'Confirmed'} Luxury Hotels:\n`);
  const byBrand = new Map<string, any[]>();
  luxuryHotels.forEach((hotel) => {
    if (!byBrand.has(hotel.brand)) {
      byBrand.set(hotel.brand, []);
    }
    byBrand.get(hotel.brand)!.push(hotel);
  });

  byBrand.forEach((hotels, brand) => {
    console.log(`\n${brand} (${hotels.length} properties):`);
    hotels.slice(0, 5).forEach((hotel) => {
      const status = hotel.validated ? '✅' : '⚠️';
      console.log(`  ${status} ${hotel.hotelId.padEnd(8)} ${hotel.hotelName} (${hotel.city})`);
      if (hotel.chainCode) {
        console.log(`    Chain: ${hotel.chainCode}`);
      }
      if (hotel.validated && hotel.rateCodeFound) {
        console.log(`    Rate Code: ${hotel.rateCodeFound}`);
        if (hotel.benefitsDetected && hotel.benefitsDetected.length > 0) {
          console.log(`    Benefits: ${hotel.benefitsDetected.join(', ')}`);
        }
      }
    });
    if (hotels.length > 5) {
      console.log(`  ... and ${hotels.length - 5} more`);
    }
  });

  // Generate TypeScript code
  console.log('\n' + '='.repeat(80));
  console.log('📝 GENERATED CODE');
  console.log('='.repeat(80) + '\n');

  const code = generateMappingCode(chainCodes, luxuryHotels);
  console.log(code);

  console.log('\n💡 Next Steps:');
  if (!skipValidation) {
    console.log('1. Review the CONFIRMED luxury hotels above (✅)');
    console.log('2. Only confirmed hotels with luxury rates will be added to the database');
    console.log('3. Copy the generated code into src/lib/data/luxury-mapping.ts');
    console.log('4. Merge with existing mappings or replace as needed');
    console.log('5. Test with: npm run dev\n');
  } else {
    console.log('⚠️  WARNING: Validation was skipped. These hotels are UNCONFIRMED.');
    console.log('1. Run with validation enabled to confirm luxury rate availability:');
    console.log('   npm run discover-luxury -- --cities="Paris,Tokyo,Dubai"');
    console.log('2. Only add CONFIRMED hotels to your production database\n');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { discoverLuxuryHotels, generateMappingCode };
