#!/usr/bin/env tsx
/**
 * Luxury Hotel Re-Verification Script
 *
 * Purpose: Detect and remove hotels that have LOST luxury program participation.
 *
 * Problem:
 * - Hotels can lose luxury program status (contract ends, franchise changes, etc.)
 * - Our database becomes stale over time
 * - Users see luxury badges on hotels that no longer participate
 *
 * Solution:
 * - Re-probe existing hotels in luxury-mapping.ts
 * - Remove hotels that fail validation 3 times in a row
 * - Update the database with only ACTIVE luxury hotels
 *
 * Usage:
 *   npm run reverify-luxury                  (re-verify all hotels)
 *   npm run reverify-luxury -- --program=VIRTUOSO   (only Virtuoso hotels)
 *   npm run reverify-luxury -- --dry-run     (preview changes only)
 *
 * Schedule: Run this monthly via cron or GitHub Actions
 */

import * as fs from 'fs';
import * as path from 'path';
import { probeLuxuryRate, type ProbeConfig, type ProbeResult } from '../src/lib/services/luxury-probe';

const MAPPING_FILE = path.join(__dirname, '../src/lib/data/luxury-mapping.ts');
const BACKUP_FILE = path.join(__dirname, '../src/lib/data/luxury-mapping.ts.backup');
const FAILURE_LOG_FILE = path.join(__dirname, '../.luxury-verification-failures.json');

interface VerificationOptions {
  program?: string;
  dryRun: boolean;
  maxRetries: number;
}

interface FailureRecord {
  hotelId: string;
  failureCount: number;
  lastFailure: string;
  chainCode?: string;
  program?: string;
}

/**
 * Parse command line arguments
 */
function parseArgs(): VerificationOptions {
  const args = process.argv.slice(2);

  let program: string | undefined;
  let dryRun = false;
  let maxRetries = 3;

  for (const arg of args) {
    if (arg.startsWith('--program=')) {
      program = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--max-retries=')) {
      maxRetries = parseInt(arg.split('=')[1], 10);
    }
  }

  return { program, dryRun, maxRetries };
}

/**
 * Load failure history from disk
 */
function loadFailureHistory(): Map<string, FailureRecord> {
  const failures = new Map<string, FailureRecord>();

  try {
    if (fs.existsSync(FAILURE_LOG_FILE)) {
      const content = fs.readFileSync(FAILURE_LOG_FILE, 'utf-8');
      const records: FailureRecord[] = JSON.parse(content);
      records.forEach((record) => {
        failures.set(record.hotelId, record);
      });
    }
  } catch (error) {
    console.warn('⚠️  Could not load failure history, starting fresh');
  }

  return failures;
}

/**
 * Save failure history to disk
 */
function saveFailureHistory(failures: Map<string, FailureRecord>): void {
  try {
    const records = Array.from(failures.values());
    fs.writeFileSync(FAILURE_LOG_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Failed to save failure history:', error);
  }
}

/**
 * Extract hotels from luxury-mapping.ts
 */
function extractExistingHotels(): {
  chainPrograms: Map<string, string>;
  virtuosoIds: Set<string>;
} {
  const chainPrograms = new Map<string, string>();
  const virtuosoIds = new Set<string>();

  try {
    const content = fs.readFileSync(MAPPING_FILE, 'utf-8');

    // Extract chain programs
    const chainMatch = content.match(/CHAIN_PROGRAMS\s*=\s*new Map<[^>]+>\(\[([^\]]*)\]\)/s);
    if (chainMatch) {
      const entries = chainMatch[1].match(/\['([^']+)',\s*'([^']+)'\]/g);
      if (entries) {
        entries.forEach((entry) => {
          const match = entry.match(/\['([^']+)',\s*'([^']+)'\]/);
          if (match) {
            chainPrograms.set(match[1], match[2]);
          }
        });
      }
    }

    // Extract Virtuoso hotel IDs
    const virtuosoMatch = content.match(/VIRTUOSO_HOTEL_IDS\s*=\s*new Set<[^>]+>\(\[([^\]]*)\]\)/s);
    if (virtuosoMatch) {
      const ids = virtuosoMatch[1].match(/'([^']+)'/g);
      if (ids) {
        ids.forEach((id) => {
          virtuosoIds.add(id.replace(/'/g, ''));
        });
      }
    }
  } catch (error) {
    console.error('❌ Could not read existing mappings:', error);
  }

  return { chainPrograms, virtuosoIds };
}

/**
 * Re-verify hotels
 */
async function reverifyHotels(options: VerificationOptions) {
  console.log('🔄 Luxury Hotel Re-Verification\n');
  console.log(`Program filter: ${options.program || 'ALL'}`);
  console.log(`Max retries before removal: ${options.maxRetries}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}\n`);

  // Load existing mappings
  console.log('📖 Reading existing mappings...\n');
  const { chainPrograms, virtuosoIds } = extractExistingHotels();
  console.log(`   Chain programs: ${chainPrograms.size}`);
  console.log(`   Virtuoso hotels: ${virtuosoIds.size}\n`);

  // Load failure history
  const failureHistory = loadFailureHistory();

  // Build list of hotels to test
  const hotelsToTest: ProbeConfig[] = [];

  // Test Virtuoso hotels (if no program filter or program is VIRTUOSO)
  if (!options.program || options.program === 'VIRTUOSO') {
    virtuosoIds.forEach((hotelId) => {
      hotelsToTest.push({
        hotelId,
        chainCode: 'INDEPENDENT', // Will test Virtuoso codes
      });
    });
  }

  // Test chain-based programs
  if (!options.program || options.program !== 'VIRTUOSO') {
    chainPrograms.forEach((program, chainCode) => {
      if (!options.program || program === options.program) {
        // We don't have hotel IDs for chain programs, skip for now
        // This would require searching cities again
        console.log(`⚠️  Skipping chain code ${chainCode} (no hotel IDs stored)`);
      }
    });
  }

  console.log(`🔬 Re-verifying ${hotelsToTest.length} hotels...\n`);

  // Re-verify each hotel
  const results = new Map<string, ProbeResult>();
  const failures: string[] = [];
  const successes: string[] = [];

  for (let i = 0; i < hotelsToTest.length; i++) {
    const hotel = hotelsToTest[i];
    console.log(`[${i + 1}/${hotelsToTest.length}] Testing ${hotel.hotelId}...`);

    const result = await probeLuxuryRate(hotel);
    results.set(hotel.hotelId, result);

    if (result.isConfirmed) {
      successes.push(hotel.hotelId);
      // Clear failure history on success
      if (failureHistory.has(hotel.hotelId)) {
        console.log(`   ✅ RECOVERED: Hotel ${hotel.hotelId} is now working again`);
        failureHistory.delete(hotel.hotelId);
      }
    } else {
      // Record failure
      const record = failureHistory.get(hotel.hotelId) || {
        hotelId: hotel.hotelId,
        failureCount: 0,
        lastFailure: '',
        chainCode: hotel.chainCode,
        program: options.program,
      };

      record.failureCount++;
      record.lastFailure = new Date().toISOString();
      failureHistory.set(hotel.hotelId, record);

      if (record.failureCount >= options.maxRetries) {
        console.log(
          `   ❌ FAILED ${record.failureCount}x: Hotel ${hotel.hotelId} should be REMOVED`
        );
        failures.push(hotel.hotelId);
      } else {
        console.log(
          `   ⚠️  FAILED ${record.failureCount}x: Hotel ${hotel.hotelId} (${options.maxRetries - record.failureCount} attempts remaining)`
        );
      }
    }

    // Rate limiting
    if (i < hotelsToTest.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Summary
  console.log(`\n📊 Re-Verification Results:`);
  console.log(`   ✅ Still valid: ${successes.length}`);
  console.log(`   ❌ To remove: ${failures.length}`);
  console.log(`   Total tested: ${hotelsToTest.length}\n`);

  // Save failure history
  if (!options.dryRun) {
    saveFailureHistory(failureHistory);
    console.log(`💾 Failure history saved to ${FAILURE_LOG_FILE}\n`);
  }

  // Update mappings file
  if (failures.length > 0) {
    console.log('🗑️  Hotels marked for removal:\n');
    failures.forEach((hotelId) => {
      const record = failureHistory.get(hotelId);
      console.log(`   ❌ ${hotelId} (failed ${record?.failureCount}x)`);
    });

    if (!options.dryRun) {
      // Remove failed hotels from Virtuoso set
      failures.forEach((hotelId) => virtuosoIds.delete(hotelId));

      // Create backup
      if (fs.existsSync(MAPPING_FILE)) {
        fs.copyFileSync(MAPPING_FILE, BACKUP_FILE);
        console.log(`\n💾 Backup created: ${BACKUP_FILE}`);
      }

      // Read original file to preserve structure
      const originalContent = fs.readFileSync(MAPPING_FILE, 'utf-8');

      // Update Virtuoso IDs section
      const virtuosoIdsArray = Array.from(virtuosoIds).sort();
      const virtuosoCode = `export const VIRTUOSO_HOTEL_IDS = new Set<string>([\n${virtuosoIdsArray
        .map((id) => `  '${id}',`)
        .join('\n')}\n]);`;

      // Replace the Virtuoso section
      const updatedContent = originalContent.replace(
        /export const VIRTUOSO_HOTEL_IDS = new Set<string>\(\[[^\]]*\]\);/s,
        virtuosoCode
      );

      fs.writeFileSync(MAPPING_FILE, updatedContent, 'utf-8');
      console.log(`✅ Updated: ${MAPPING_FILE}`);
      console.log(`   Removed ${failures.length} failed hotels\n`);
    } else {
      console.log('\n🔍 DRY RUN: No files were modified\n');
    }
  } else {
    console.log('✅ All hotels are still valid! No changes needed.\n');
  }

  console.log('💡 Next Steps:');
  if (options.dryRun) {
    console.log('   Run without --dry-run to apply changes');
  } else {
    console.log('   1. Review the changes in luxury-mapping.ts');
    console.log('   2. Test with: npm run dev');
    console.log('   3. Commit and deploy');
    console.log('   4. Schedule this script to run monthly\n');
  }
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();
  await reverifyHotels(options);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { reverifyHotels };
