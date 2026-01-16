# Quick Integration Guide: Adding Luxury Enrichment to Existing Search Route

## Current State

Your existing search route (`src/app/api/search/hotels/route.ts`) returns raw Sabre results:

```typescript
const results = await searchHotels(searchParams);
return NextResponse.json({ results });
```

## Integration Steps

### Step 1: Import the Enrichment Service

Add this import at the top of your existing route file:

```typescript
import { enrichHotelResults } from '@/lib/services/hotel-enricher';
```

### Step 2: Modify the Search Logic

Find this section in your route (around line 74):

**BEFORE:**
```typescript
const results = await searchHotels(searchParams);
cache.set(cacheKey, results, CACHE_TTL.SEARCH_RESULTS);

return NextResponse.json({
  success: true,
  results,
  count: results.length,
  // ...
});
```

**AFTER:**
```typescript
// Get raw results from Sabre
const rawResults = await searchHotels(searchParams);

// ✨ ENRICH with luxury program data
const enrichedResults = enrichHotelResults(rawResults);

// Cache ENRICHED results (not raw!)
cache.set(cacheKey, enrichedResults, CACHE_TTL.SEARCH_RESULTS);

// Calculate stats
const luxuryCount = enrichedResults.filter(h => h.isLuxury).length;

return NextResponse.json({
  success: true,
  results: enrichedResults, // Return enriched results
  count: enrichedResults.length,
  luxuryCount, // Add luxury count to response
  // ...
});
```

### Step 3: Update Cache Type

Find the cached results section (around line 52):

**BEFORE:**
```typescript
const cachedResults = cache.get<HotelSearchResult[]>(cacheKey);
```

**AFTER:**
```typescript
import { type EnrichedHotelResult } from '@/lib/services/hotel-enricher';

const cachedResults = cache.get<EnrichedHotelResult[]>(cacheKey);
```

And update the cached response:

```typescript
if (cachedResults) {
  const luxuryCount = cachedResults.filter(h => h.isLuxury).length;

  return NextResponse.json({
    success: true,
    results: cachedResults,
    count: cachedResults.length,
    luxuryCount, // Add this
    cached: true,
    // ...
  });
}
```

## Complete Modified Route

Here's the complete modified file with changes highlighted:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchHotels, HotelSearchResult } from '@/lib/sabre/search';
import { enrichHotelResults, type EnrichedHotelResult } from '@/lib/services/hotel-enricher'; // ✨ ADD
import { Location } from '@/types/location';
import { cache, generateSearchCacheKey, CACHE_TTL } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { location, checkIn, checkOut, rooms, adults, children, radius } = body;

    // ... validation code stays the same ...

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
    const cachedResults = cache.get<EnrichedHotelResult[]>(cacheKey); // ✨ CHANGE TYPE

    if (cachedResults) {
      console.log('✅ Returning cached search results for:', cacheKey);

      const luxuryCount = cachedResults.filter(h => h.isLuxury).length; // ✨ ADD

      return NextResponse.json({
        success: true,
        results: cachedResults,
        count: cachedResults.length,
        luxuryCount, // ✨ ADD
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
    const rawResults = await searchHotels(searchParams); // ✨ RENAME

    // ✨ ADD: Enrich results with luxury program data
    const enrichedResults = enrichHotelResults(rawResults);

    // Store ENRICHED results in cache
    cache.set(cacheKey, enrichedResults, CACHE_TTL.SEARCH_RESULTS); // ✨ CHANGE

    // ✨ ADD: Calculate luxury stats
    const luxuryCount = enrichedResults.filter(h => h.isLuxury).length;

    return NextResponse.json({
      success: true,
      results: enrichedResults, // ✨ CHANGE
      count: enrichedResults.length,
      luxuryCount, // ✨ ADD
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
    // ... error handling stays the same ...
  }
}
```

## Frontend Changes

### Update Hotel Type

If you have a hotel card component, update its type:

**BEFORE:**
```typescript
import { HotelSearchResult } from '@/lib/sabre/search';

function HotelCard({ hotel }: { hotel: HotelSearchResult }) {
  // ...
}
```

**AFTER:**
```typescript
import { EnrichedHotelResult } from '@/lib/services/hotel-enricher';

function HotelCard({ hotel }: { hotel: EnrichedHotelResult }) {
  // Now you can access hotel.luxuryPrograms and hotel.isLuxury
}
```

### Add Luxury Badges

Add luxury badges to your hotel card:

```tsx
import { LuxuryBadgeGroup } from '@/components/hotel/LuxuryBadge';

function HotelCard({ hotel }: { hotel: EnrichedHotelResult }) {
  return (
    <div className="hotel-card">
      <img src={hotel.imageUrl} alt={hotel.name} />

      <div className="hotel-info">
        <h3>{hotel.name}</h3>

        {/* ✨ ADD: Luxury badges */}
        {hotel.isLuxury && (
          <LuxuryBadgeGroup
            programs={hotel.luxuryPrograms}
            size="sm"
            maxVisible={2}
          />
        )}

        <p className="address">{hotel.address}</p>
        <p className="price">From ${hotel.minRate}/night</p>
      </div>
    </div>
  );
}
```

## Testing

### 1. Verify Enrichment Works

```bash
# Start dev server
npm run dev

# Make a search request
curl -X POST http://localhost:3000/api/search/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"name": "Paris", "code": "PAR"},
    "checkIn": "2026-06-01",
    "checkOut": "2026-06-05"
  }'
```

Check the response - each hotel should now have:
```json
{
  "id": "12345",
  "name": "Four Seasons Hotel George V Paris",
  "chainCode": "FS",
  "luxuryPrograms": ["FOUR_SEASONS_PREFERRED"],
  "isLuxury": true,
  ...
}
```

### 2. Check Console Logs

You should see logs like:
```
⏳ Cache miss - fetching fresh results for: paris-2026-06-01-2026-06-05-1-2-0
✨ Enriched 45 hotels:
   - 8 luxury properties (17.8%)
```

### 3. Verify Cache Works

Make the same request twice. The second should return instantly with `cached: true`.

## Rollback Plan

If something breaks, simply revert these changes:

```bash
git diff src/app/api/search/hotels/route.ts
git checkout -- src/app/api/search/hotels/route.ts
```

The luxury enrichment files won't interfere with your existing code if not imported.

## Support

If you encounter issues:

1. **TypeScript errors:** Make sure EnrichedHotelResult extends your existing HotelSearchResult
2. **Missing badges:** Check that framer-motion is installed (`npm install framer-motion`)
3. **Performance issues:** Enrichment adds ~10ms for 100 hotels - should be negligible
4. **Cache issues:** Clear cache and test fresh search

## Next Steps

Once integrated:

1. Add luxury filter UI to your search page
2. Highlight luxury hotels in search results
3. Add luxury count to search summary ("3 luxury hotels available")
4. Sort luxury hotels to the top of results
5. Track conversion rates for luxury vs non-luxury bookings
