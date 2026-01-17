# Luxury Hotel Auto-Discovery System

## Overview

Instead of manually maintaining luxury hotel mappings, this system automatically discovers and populates luxury hotel data by analyzing real Sabre search results.

## 🚨 CRITICAL: Deployment Context

**These scripts are LOCAL/CI tasks, NOT runtime operations:**

- ✅ **Run locally** on your machine or in CI/CD pipeline
- ✅ **Commit** the updated `luxury-mapping.ts` to Git
- ✅ **Deploy** the committed file to production
- ❌ **DO NOT** run these scripts on Vercel/Lambda/serverless (read-only filesystem)

**Why:** Serverless platforms like Vercel, AWS Lambda, and Netlify have read-only filesystems at runtime. You cannot write to `src/lib/data/luxury-mapping.ts` in production. This is a **build-time operation**, not a runtime operation.

**Workflow:**
```
Local Machine → Run Scripts → Update luxury-mapping.ts → Git Commit → Deploy
```

## How It Works

The system uses a **TWO-PHASE APPROACH** to ensure only CONFIRMED luxury hotels are added:

### Phase 1: HYPOTHESIS - Pattern Recognition
Identifies candidate luxury hotels using pattern matching:

```typescript
// Examples of patterns used:
- "Four Seasons" → FOUR_SEASONS_PREFERRED
- "Ritz-Carlton" → RITZ_CARLTON_STARS
- "Aman" → AMAN_PREFERRED
- "Park Hyatt" → VIRTUOSO
- "St. Regis" → VIRTUOSO
```

This phase generates a list of CANDIDATE hotels based on name matching.

### Phase 2: PROOF - Rate Validation
Validates each candidate by probing the Sabre API for luxury rate codes:

```typescript
// For each candidate hotel:
1. Query Sabre: "Give me the FSP rate for Hotel ID 12345"
2. If Sabre returns FSP → ✅ CONFIRMED
3. If Sabre returns only standard rates → ❌ REJECTED
```

**Critical Rate Codes Tested:**
- Four Seasons: `FSP`, `FPP`
- Ritz-Carlton STARS: `S72`, `STR`, `MBS`
- Mandarin Oriental: `MOF`, `FAN`
- Virtuoso: `VIR`, `VRT`, `VTU`
- Hyatt Prive: `P12`, `PRI`
- Rosewood: `RWE`, `RWP`

**Only hotels that return luxury rates are added to the database.**

### 3. Chain Code Discovery
Analyzes search results to:
- Extract unique chain codes
- Count frequency of each chain
- Map chains to luxury programs

### 4. Hotel ID Collection
Builds a database of VALIDATED luxury hotel IDs:
- ✅ Confirmed via actual rate queries
- ⚠️ Rejected if no luxury rates found
- Only confirmed hotels added to mappings

## Usage

### Discovery Mode (View Results)

**Discover and validate luxury hotels (RECOMMENDED):**
```bash
npm run discover-luxury
```

**Discover in specific cities with validation:**
```bash
npm run discover-luxury -- --cities="Paris,Tokyo,Dubai,New York,London"
```

**Skip validation (faster, but unconfirmed):**
```bash
npm run discover-luxury -- --skip-validation
```

This will:
- **Phase 1:** Search for hotels and identify candidates via pattern matching
- **Phase 2:** Validate candidates by probing Sabre for luxury rates (unless --skip-validation)
- Show CONFIRMED luxury hotels (✅) and REJECTED hotels (❌)
- Print generated TypeScript code
- **NOT modify any files**

⚠️ **Important:** Validation is ON by default. Only skip if you want a quick preview.

### Update Mode (Modify Files)

**Dry run with validation (preview changes):**
```bash
npm run update-luxury-mappings -- --dry-run
```

**Merge with existing mappings (RECOMMENDED):**
```bash
npm run update-luxury-mappings -- --merge
```

**Replace existing mappings:**
```bash
npm run update-luxury-mappings -- --replace
```

**Update with specific cities:**
```bash
npm run update-luxury-mappings -- --cities="Paris,Dubai,Singapore" --merge
```

**Skip validation (NOT recommended for production):**
```bash
npm run update-luxury-mappings -- --merge --skip-validation
```

⚠️ **Warning:** Using `--skip-validation` adds unconfirmed hotels. Only use for testing.

### Re-Verification Mode (Detect Stale Data)

Hotels can lose luxury program participation over time (contracts expire, franchises change, etc.). Run monthly re-verification to keep your database fresh:

**Re-verify all hotels:**
```bash
npm run reverify-luxury
```

**Re-verify specific program:**
```bash
npm run reverify-luxury -- --program=VIRTUOSO
```

**Dry run (preview removals):**
```bash
npm run reverify-luxury -- --dry-run
```

**How it works:**
1. Re-probes each hotel in your database
2. Tracks failure count for each hotel
3. Removes hotels after 3 consecutive failures
4. Maintains failure history in `.luxury-verification-failures.json`

**Schedule this monthly** via cron or GitHub Actions to keep your database current.

Example cron (1st of each month at 2am):
```cron
0 2 1 * * cd /path/to/project && npm run reverify-luxury
```

Example GitHub Action:
```yaml
name: Monthly Luxury Re-Verification
on:
  schedule:
    - cron: '0 2 1 * *'  # 1st of month at 2am
jobs:
  reverify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run reverify-luxury
      - name: Commit changes
        run: |
          git config --global user.name 'Luxury Bot'
          git config --global user.email 'bot@example.com'
          git add src/lib/data/luxury-mapping.ts
          git commit -m "chore: remove stale luxury hotels" || exit 0
          git push
```

## What Gets Updated

The scripts modify `src/lib/data/luxury-mapping.ts`:

**CHAIN_PROGRAMS Map:**
```typescript
export const CHAIN_PROGRAMS = new Map<string, LuxuryProgram>([
  ['FS', 'FOUR_SEASONS_PREFERRED'],  // ✅ Auto-discovered
  ['RZ', 'RITZ_CARLTON_STARS'],      // ✅ Auto-discovered
  // ... more
]);
```

**VIRTUOSO_HOTEL_IDS Set:**
```typescript
export const VIRTUOSO_HOTEL_IDS = new Set<string>([
  '02179', // The Plaza, New York          // ✅ Auto-discovered
  '12847', // Mandarin Oriental, Bangkok   // ✅ Auto-discovered
  // ... more
]);
```

## Safety Features

### Automatic Backups
Before modifying files, a backup is created:
```
src/lib/data/luxury-mapping.ts.backup
```

### Merge Mode
Preserves your manual additions while adding discovered hotels.

### Dry Run
Preview changes without modifying files:
```bash
npm run update-luxury-mappings -- --dry-run
```

## Supported Luxury Programs

The system currently recognizes these luxury programs:

| Program | Brands Detected |
|---------|----------------|
| **FOUR_SEASONS_PREFERRED** | Four Seasons |
| **RITZ_CARLTON_STARS** | Ritz-Carlton |
| **AMAN_PREFERRED** | Aman |
| **ROSEWOOD_ELITE** | Rosewood |
| **PENINSULA_PRIVILEGE** | Peninsula |
| **BELMOND_BELLINI** | Belmond |
| **VIRTUOSO** | Mandarin Oriental, Park Hyatt, St. Regis, W Hotels, Conrad, Waldorf Astoria, Raffles, Banyan Tree, Six Senses, Capella, Bulgari, Oberoi, One&Only, Andaz |

## Extending the System

### Adding New Brand Patterns

Edit `scripts/discover-luxury-hotels.ts`:

```typescript
const LUXURY_BRAND_PATTERNS: LuxuryBrandPattern[] = [
  // Add new pattern
  {
    pattern: /your brand name/i,
    program: 'YOUR_PROGRAM_NAME',
    brand: 'Display Name',
  },
  // ... existing patterns
];
```

### Adding New Cities

```bash
npm run discover-luxury -- --cities="Milan,Barcelona,Sydney,Maldives"
```

More cities = more comprehensive discovery.

## Example Workflow

### Initial Setup
```bash
# 1. Discover luxury hotels (preview)
npm run discover-luxury -- --cities="Paris,New York,Tokyo,Dubai,London"

# 2. Review the output

# 3. Update mappings (dry run first)
npm run update-luxury-mappings -- --dry-run

# 4. Apply updates
npm run update-luxury-mappings -- --merge
```

### Monthly Maintenance
```bash
# Run discovery on new destinations monthly
npm run update-luxury-mappings -- --cities="Maldives,Bali,Phuket,Santorini" --merge
```

### Rollback Changes
```bash
# If something went wrong, restore backup
cp src/lib/data/luxury-mapping.ts.backup src/lib/data/luxury-mapping.ts
```

## Performance

### Discovery Speed
- ~1-2 seconds per city (with Sabre API)
- 5 cities = ~5-10 seconds total
- Rate limited to avoid API throttling

### Results Expected
- **Paris**: ~40-50 hotels, 3-5 luxury properties
- **Dubai**: ~40-50 hotels, 8-12 luxury properties
- **Tokyo**: ~40-50 hotels, 4-6 luxury properties
- **Maldives**: ~30-40 hotels, 15-20 luxury properties (high concentration)

### Coverage
After running on 10-15 major cities, you should have:
- **~15-25 chain codes** mapped
- **~100-150 Virtuoso hotel IDs**
- **90%+ coverage** of major luxury brands

## Output Examples

### Discovery Output
```
🔍 Starting luxury hotel discovery...

📍 Searching Paris...
   Found 43 hotels

📍 Searching Dubai...
   Found 47 hotels

📊 DISCOVERY RESULTS
════════════════════════════════════════════════════════════════════════════════

Total hotels analyzed: 203
Unique chain codes: 45
Luxury hotels found: 23

🏢 Top Chain Codes (by frequency):

 1. HH         ( 18x) Hilton Hotels
 2. MC         ( 15x) Marriott
 3. FS         ( 12x) Four Seasons
 4. IH         ( 10x) InterContinental
 5. RZ         (  8x) Ritz-Carlton

✨ Discovered Luxury Hotels:

Four Seasons (4 properties):
  • 45821    Four Seasons Hotel George V Paris (Paris)
    Chain: FS
  • 38291    Four Seasons Resort Dubai at Jumeirah Beach (Dubai)
    Chain: FS

Virtuoso (12 properties):
  • 12847    Mandarin Oriental Bangkok (Bangkok)
    Chain: MO
  • 06368    Le Bristol Paris (Paris)
    Chain: LB
  ... and 10 more
```

### Update Output
```
🔄 Luxury Mapping Auto-Updater

Mode: merge
Cities: Paris, Dubai, Tokyo
Dry run: No

✅ Discovery complete:
   Total hotels analyzed: 127
   Luxury hotels found: 18

📖 Reading existing mappings...
   Existing chain codes: 6
   Existing Virtuoso IDs: 10

🔀 Merging with existing mappings...

  ➕ Added chain: MO → BELMOND_BELLINI
  ➕ Added Virtuoso hotel: 38475 (Park Hyatt Dubai)
  ➕ Added Virtuoso hotel: 29384 (St. Regis Tokyo)

📊 Final counts:
   Chain codes: 9 (+3 new)
   Virtuoso IDs: 15 (+5 new)

💾 Backup created: src/lib/data/luxury-mapping.ts.backup

✅ Updated: src/lib/data/luxury-mapping.ts

✨ Done! Your luxury mappings have been updated.
```

## Troubleshooting

### No luxury hotels found
- **Cause:** CERT environment has limited hotels
- **Solution:** Run against production Sabre API or use more cities

### TypeScript errors after update
- **Cause:** New program names don't exist in type definitions
- **Solution:** Add new programs to `LuxuryProgram` type in luxury-mapping.ts

### Backup not found
- **Cause:** First time running or file was deleted
- **Solution:** Use git to restore: `git checkout src/lib/data/luxury-mapping.ts`

## Best Practices

### Discovery & Updates
1. **Start with dry run** to preview changes
2. **Use merge mode** to preserve manual additions
3. **Run monthly** to discover new properties
4. **Target luxury destinations** (Dubai, Maldives, Paris, etc.)
5. **Review generated code** before committing
6. **Keep backups** of your custom mappings

### Avoiding False Negatives
1. **Use dynamic dates** (45+ days in future) - Already implemented ✅
2. **Avoid major holidays:**
   - Christmas/New Year (Dec 20 - Jan 5)
   - Easter week
   - Major local holidays in target cities
   - Hotels may have minimum stay restrictions that cause false negatives
3. **Re-verify on failure:** If a hotel fails once, don't immediately remove it. The script uses a 3-strike rule.
4. **Test during low season:** Hotels are more likely to return flexible rates in low season
5. **Monitor failure patterns:** If many hotels fail at once, it might be a Sabre API issue, not hotel issues

### Operational Safety
1. **Never run on production servers** - These are local/CI tasks only
2. **Commit changes to Git** before deploying
3. **Test locally first** with `--dry-run`
4. **Schedule re-verification monthly** to catch stale data
5. **Review removals manually** - Don't auto-commit removals without review

## Future Enhancements

### Planned Features
- [ ] Scrape Virtuoso.com directory
- [ ] Integration with Preferred Partners API
- [ ] Machine learning for brand detection
- [ ] Confidence scores for matches
- [ ] Hotel name normalization
- [ ] Cross-reference with multiple sources

### Integration Ideas
- Run automatically in CI/CD pipeline
- Schedule monthly cron job
- Webhook trigger on new hotels added to Sabre
- Admin UI for reviewing discoveries

## FAQ

**Q: Will this overwrite my manual entries?**
A: No, if you use `--merge` mode. Use `--replace` only if you want to start fresh.

**Q: How often should I run this?**
A: Monthly is recommended, or whenever you notice missing luxury hotels.

**Q: Can I edit the generated mappings manually?**
A: Yes! The merge mode will preserve your edits.

**Q: What if I want to exclude certain hotels?**
A: Edit the generated file and add comments. Merge mode preserves comments.

**Q: Does this work with production Sabre API?**
A: Yes! It works with both CERT and production. Production has more hotels.

## Support

For issues or questions:
1. Check this documentation
2. Review script output for errors
3. Check backup file if something went wrong
4. Restore from git if needed

## License

Part of the Bellhopping Replica project.
