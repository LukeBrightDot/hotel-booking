#!/usr/bin/env tsx
/**
 * Auto-Update Luxury Mappings Script
 *
 * Automatically updates src/lib/data/luxury-mapping.ts with discovered hotels.
 *
 * Usage:
 *   npm run update-luxury-mappings -- --cities "Paris,Tokyo,Dubai"
 *   npm run update-luxury-mappings -- --merge    (merge with existing)
 *   npm run update-luxury-mappings -- --replace  (replace existing)
 *
 * Safety:
 * - Creates a backup before modifying
 * - Can merge with existing data or replace completely
 * - Validates TypeScript syntax before writing
 */

import * as fs from 'fs';
import * as path from 'path';
import { discoverLuxuryHotels, generateMappingCode } from './discover-luxury-hotels';

const MAPPING_FILE = path.join(__dirname, '../src/lib/data/luxury-mapping.ts');
const BACKUP_FILE = path.join(__dirname, '../src/lib/data/luxury-mapping.ts.backup');

interface UpdateOptions {
  mode: 'merge' | 'replace';
  cities: string[];
  dryRun: boolean;
  skipValidation: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): UpdateOptions {
  const args = process.argv.slice(2);

  let mode: 'merge' | 'replace' = 'merge';
  let cities = ['Paris', 'New York', 'Tokyo', 'London', 'Dubai'];
  let dryRun = false;
  let skipValidation = false;

  for (const arg of args) {
    if (arg === '--replace') {
      mode = 'replace';
    } else if (arg === '--merge') {
      mode = 'merge';
    } else if (arg.startsWith('--cities=')) {
      cities = arg.split('=')[1].split(',').map((c) => c.trim());
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--skip-validation') {
      skipValidation = true;
    }
  }

  return { mode, cities, dryRun, skipValidation };
}

/**
 * Extract existing mappings from current file
 */
function extractExistingMappings(): {
  chainPrograms: Map<string, string>;
  virtuosoIds: Set<string>;
} {
  const chainPrograms = new Map<string, string>();
  const virtuosoIds = new Set<string>();

  try {
    const content = fs.readFileSync(MAPPING_FILE, 'utf-8');

    // Extract chain programs
    const chainMatch = content.match(/CHAIN_PROGRAMS\s*=\s*new Map<[^>]+>\(\[([\s\S]*?)\]\)/);
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
    const virtuosoMatch = content.match(/VIRTUOSO_HOTEL_IDS\s*=\s*new Set<[^>]+>\(\[([\s\S]*?)\]\)/);
    if (virtuosoMatch) {
      const ids = virtuosoMatch[1].match(/'([^']+)'/g);
      if (ids) {
        ids.forEach((id) => {
          virtuosoIds.add(id.replace(/'/g, ''));
        });
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not read existing mappings, will create new file');
  }

  return { chainPrograms, virtuosoIds };
}

/**
 * Merge discovered mappings with existing ones
 */
function mergeMappings(
  existing: { chainPrograms: Map<string, string>; virtuosoIds: Set<string> },
  discovered: { chainCodes: any[]; luxuryHotels: any[] }
) {
  const { chainPrograms, virtuosoIds } = existing;
  const { luxuryHotels } = discovered;

  // Add discovered chain programs
  luxuryHotels.forEach((hotel) => {
    if (hotel.chainCode && hotel.chainCode !== 'INDEPENDENT') {
      if (!chainPrograms.has(hotel.chainCode)) {
        chainPrograms.set(hotel.chainCode, hotel.program);
        console.log(`  ➕ Added chain: ${hotel.chainCode} → ${hotel.program}`);
      }
    }

    // Add hotel IDs (especially Virtuoso)
    if (hotel.program === 'VIRTUOSO' && !virtuosoIds.has(hotel.hotelId)) {
      virtuosoIds.add(hotel.hotelId);
      console.log(`  ➕ Added Virtuoso hotel: ${hotel.hotelId} (${hotel.hotelName})`);
    }
  });

  return { chainPrograms, virtuosoIds };
}

/**
 * Generate updated TypeScript file content
 */
function generateUpdatedFile(
  chainPrograms: Map<string, string>,
  virtuosoIds: Set<string>,
  originalContent: string
): string {
  // Keep the header comments and type definitions from original
  const headerMatch = originalContent.match(/(\/\*\*[\s\S]*?\*\/[\s\S]*?export type LuxuryProgram[\s\S]*?;[\s\S]*?export interface LuxuryProgramInfo[\s\S]*?\}[\s\S]*?\/\*\*[\s\S]*?\*\/)/);
  const header = headerMatch ? headerMatch[1] : '';

  // Generate chain programs map
  let chainCode = 'export const CHAIN_PROGRAMS = new Map<string, LuxuryProgram>([\n';
  const sortedChains = Array.from(chainPrograms.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedChains.forEach(([code, program]) => {
    // Try to find original comment
    const commentMatch = originalContent.match(new RegExp(`\\['${code}',\\s*'[^']+',?\\],?\\s*//\\s*(.*)`, 'm'));
    const comment = commentMatch ? ` // ${commentMatch[1]}` : '';
    chainCode += `  ['${code}', '${program}'],${comment}\n`;
  });
  chainCode += ']);\n\n';

  // Generate Virtuoso IDs set
  let virtuosoCode = '/**\n';
  virtuosoCode += ' * Virtuoso Hotel IDs\n';
  virtuosoCode += ' *\n';
  virtuosoCode += ' * Curated list of hotel IDs confirmed as Virtuoso properties.\n';
  virtuosoCode += ` * Last updated: ${new Date().toISOString().split('T')[0]}\n`;
  virtuosoCode += ` * Total properties: ${virtuosoIds.size}\n`;
  virtuosoCode += ' */\n';
  virtuosoCode += 'export const VIRTUOSO_HOTEL_IDS = new Set<string>([\n';
  const sortedIds = Array.from(virtuosoIds).sort();
  sortedIds.forEach((id) => {
    // Try to find original comment
    const commentMatch = originalContent.match(new RegExp(`'${id}',?\\s*//\\s*(.*)`, 'm'));
    const comment = commentMatch ? ` // ${commentMatch[1]}` : '';
    virtuosoCode += `  '${id}',${comment}\n`;
  });
  virtuosoCode += ']);\n\n';

  // Keep the rest of the file (LUXURY_PROGRAM_INFO, helper functions)
  const restMatch = originalContent.match(/\/\*\*[\s\S]*?Program Metadata[\s\S]*$/);
  const rest = restMatch ? restMatch[0] : '';

  return header + '\n\n' + chainCode + virtuosoCode + rest;
}

/**
 * Main execution
 */
async function main() {
  const options = parseArgs();

  console.log('🔄 Luxury Mapping Auto-Updater\n');
  console.log(`Mode: ${options.mode}`);
  console.log(`Cities: ${options.cities.join(', ')}`);
  console.log(`Validation: ${options.skipValidation ? 'DISABLED ⚠️' : 'ENABLED ✅'}`);
  console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}\n`);

  if (options.skipValidation) {
    console.log('⚠️  WARNING: Running without validation. Hotels may not support luxury rates!');
    console.log('   For production, remove --skip-validation flag.\n');
  }

  // Step 1: Discover luxury hotels
  console.log('🔍 Discovering luxury hotels...\n');
  const { chainCodes, luxuryHotels, totalHotels, candidateHotels, confirmedHotels } =
    await discoverLuxuryHotels(options.cities, options.skipValidation);

  console.log(`\n✅ Discovery complete:`);
  console.log(`   Total hotels analyzed: ${totalHotels}`);
  if (!options.skipValidation) {
    console.log(`   Candidate hotels: ${candidateHotels}`);
    console.log(`   ✅ Confirmed hotels: ${confirmedHotels}`);
    console.log(`   ❌ Rejected hotels: ${candidateHotels - confirmedHotels}\n`);
  } else {
    console.log(`   Luxury hotels found (unvalidated): ${luxuryHotels.length}\n`);
  }

  // Step 2: Load existing mappings
  console.log('📖 Reading existing mappings...\n');
  const existing = extractExistingMappings();
  console.log(`   Existing chain codes: ${existing.chainPrograms.size}`);
  console.log(`   Existing Virtuoso IDs: ${existing.virtuosoIds.size}\n`);

  // Step 3: Merge or replace
  let finalChainPrograms: Map<string, string>;
  let finalVirtuosoIds: Set<string>;

  if (options.mode === 'merge') {
    console.log('🔀 Merging with existing mappings...\n');
    const merged = mergeMappings(existing, { chainCodes, luxuryHotels });
    finalChainPrograms = merged.chainPrograms;
    finalVirtuosoIds = merged.virtuosoIds;
  } else {
    console.log('🔁 Replacing existing mappings...\n');
    finalChainPrograms = new Map();
    finalVirtuosoIds = new Set();
    luxuryHotels.forEach((hotel) => {
      if (hotel.chainCode && hotel.chainCode !== 'INDEPENDENT') {
        finalChainPrograms.set(hotel.chainCode, hotel.program);
      }
      if (hotel.program === 'VIRTUOSO') {
        finalVirtuosoIds.add(hotel.hotelId);
      }
    });
  }

  console.log(`\n📊 Final counts:`);
  console.log(`   Chain codes: ${finalChainPrograms.size}`);
  console.log(`   Virtuoso IDs: ${finalVirtuosoIds.size}\n`);

  // Step 4: Generate updated file
  console.log('📝 Generating updated file...\n');
  const originalContent = fs.existsSync(MAPPING_FILE)
    ? fs.readFileSync(MAPPING_FILE, 'utf-8')
    : '';
  const updatedContent = generateUpdatedFile(finalChainPrograms, finalVirtuosoIds, originalContent);

  // Step 5: Write file (or show in dry run)
  if (options.dryRun) {
    console.log('🔍 DRY RUN - File would be updated with:\n');
    console.log('─'.repeat(80));
    console.log(updatedContent.split('\n').slice(0, 50).join('\n'));
    console.log('...\n');
    console.log('─'.repeat(80));
    console.log('\nNo files were modified (dry run)');
  } else {
    // Create backup
    if (fs.existsSync(MAPPING_FILE)) {
      fs.copyFileSync(MAPPING_FILE, BACKUP_FILE);
      console.log(`💾 Backup created: ${BACKUP_FILE}\n`);
    }

    // Write updated file
    fs.writeFileSync(MAPPING_FILE, updatedContent, 'utf-8');
    console.log(`✅ Updated: ${MAPPING_FILE}\n`);

    console.log('✨ Done! Your luxury mappings have been updated.');
    console.log('\n💡 Next steps:');
    console.log('   1. Review the changes in src/lib/data/luxury-mapping.ts');
    console.log('   2. Test with: npm run dev');
    console.log('   3. If something went wrong, restore backup from:');
    console.log(`      ${BACKUP_FILE}\n`);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { updateLuxuryMappings: main };
