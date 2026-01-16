# Hotel Image Implementation - Phase 2 Plan

**Date:** 2026-01-16
**Branch:** `claude/improve-assistant-ui-vPHob`
**Status:** Phase 1 ✅ Complete | Phase 2 Ready for Implementation

---

## Current State Summary

### Phase 1 - COMPLETE ✅

The following is already implemented on this branch:

| Component | Status | File |
|-----------|--------|------|
| Next.js image domains | ✅ Done | `next.config.ts` |
| `getHeroImage()` extractor | ✅ Done | `src/lib/sabre/search.ts` |
| MediaItems parsing | ✅ Done | `src/lib/sabre/search.ts` |
| ResortCard with Next.js Image | ✅ Done | `src/components/voice/ResortCard.tsx` |
| Map image filtering | ✅ Done | `src/lib/sabre/search.ts` |
| Fallback placeholder | ✅ Done | Unsplash URL |

**Image Source:** Sabre V5 search response at path `HotelInfo.MediaItems.MediaItem[]`

### What's Missing

1. **QueryClientProvider** - Not wrapped in layout.tsx (needed for TanStack Query)
2. **Lazy loading hook** - For hotels where search doesn't return images
3. **Phase 2 Database Override** - Curated images for luxury properties

---

## Implementation Plan

### Step 1: Add TanStack Query Infrastructure

**File:** `src/components/providers/QueryProvider.tsx` (CREATE)

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,  // 5 minutes
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**File:** `src/app/layout.tsx` (MODIFY)

```typescript
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Bellhopping - Book Luxury Hotels with 30% Commission",
  description: "Bellhopping is a sales platform for Travel Agents...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <Header />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### Step 2: Create Fallback Image Hook

For hotels where the search API doesn't return images, fetch on-demand.

**File:** `src/hooks/useHotelImage.ts` (CREATE)

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

export function useHotelImage(hotelId: string, initialUrl?: string | null) {
  return useQuery({
    queryKey: ['hotel-media', hotelId],
    queryFn: async () => {
      const { data } = await axios.get<{ url: string | null }>(
        `/api/hotel/media?id=${hotelId}`
      );
      return data.url || FALLBACK_IMAGE;
    },
    enabled: !initialUrl,  // Only fetch if no image from search
    staleTime: 1000 * 60 * 60 * 24,  // 24 hours
    gcTime: 1000 * 60 * 60 * 24,
    initialData: initialUrl || undefined,
    retry: 1,
  });
}
```

### Step 3: Create Media API Endpoint (Fallback)

For hotels missing images in search response, call Sabre's media endpoint.

**File:** `src/app/api/hotel/media/route.ts` (CREATE)

```typescript
import { NextResponse } from 'next/server';
import { getAuthToken, getApiBaseUrl } from '@/lib/sabre/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('id');

  if (!hotelId) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  try {
    const token = await getAuthToken();
    const baseUrl = getApiBaseUrl();

    // Try Sabre GetHotelContent endpoint for images
    const response = await fetch(`${baseUrl}/v3.0.0/get/hotelcontent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        GetHotelContentRQ: {
          version: '3.0.0',
          HotelRefs: {
            HotelRef: [{ HotelCode: hotelId }]
          },
          ContentTypes: {
            Images: { SizeType: 'LARGE' }
          }
        }
      }),
    });

    if (!response.ok) {
      console.error(`Media fetch failed for ${hotelId}: ${response.status}`);
      return NextResponse.json({ url: null });
    }

    const data = await response.json();
    const images = data.GetHotelContentRS?.HotelContents?.HotelContent?.[0]?.Images?.Image || [];

    // Filter out maps, prefer exterior/lobby images
    const heroImage = images.find((img: any) => {
      const category = img.Category?.toLowerCase() || '';
      return !category.includes('map') &&
             (category.includes('exterior') || category.includes('lobby'));
    }) || images.find((img: any) => !img.Category?.toLowerCase().includes('map'));

    return NextResponse.json(
      { url: heroImage?.Url || null },
      { headers: { 'Cache-Control': 'public, max-age=86400' } }
    );
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json({ url: null });
  }
}
```

### Step 4: Phase 2 - Database Override for Luxury Hotels

**File:** `prisma/schema.prisma` (ADD to existing)

```prisma
model LuxuryHotelImage {
  id          String   @id @default(cuid())
  hotelCode   String   @unique
  heroImage   String   // Curated high-res image URL
  images      String[] // Array of curated images
  lastUpdated DateTime @updatedAt

  @@index([hotelCode])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_luxury_hotel_images
```

**File:** `src/lib/services/hotel-enricher.ts` (MODIFY)

Add database lookup to existing enricher:

```typescript
// Add to enrichHotelResults function:

// Get curated images from database
const hotelCodes = sabreResults.map(h => h.hotelCode);
const luxuryImages = await prisma.luxuryHotelImage.findMany({
  where: { hotelCode: { in: hotelCodes } }
});

const imageMap = new Map(luxuryImages.map(h => [h.hotelCode, h]));

// In the map function, add image override:
return sabreResults.map(hotel => {
  const curatedImages = imageMap.get(hotel.hotelCode);
  const luxuryPrograms = getLuxuryPrograms(hotel.chainCode, hotel.hotelCode);

  return {
    ...hotel,
    luxuryPrograms,
    isLuxury: luxuryPrograms.length > 0,
    // Override with curated images if available
    thumbnail: curatedImages?.heroImage || hotel.thumbnail,
    images: curatedImages?.images.length ? curatedImages.images : hotel.images,
  };
});
```

### Step 5: Image Curation Script (Optional)

**File:** `scripts/curate-luxury-images.ts` (CREATE)

```typescript
import { PrismaClient } from '@prisma/client';
import { getAuthToken, getApiBaseUrl } from '../src/lib/sabre/auth';

const prisma = new PrismaClient();

const LUXURY_HOTEL_CODES = [
  '100001', // Four Seasons Paris
  '100002', // Ritz Paris
  // Add more luxury hotel codes
];

async function curateLuxuryImages() {
  const token = await getAuthToken();
  const baseUrl = getApiBaseUrl();

  for (const hotelCode of LUXURY_HOTEL_CODES) {
    console.log(`Curating images for hotel: ${hotelCode}`);

    try {
      const response = await fetch(`${baseUrl}/v3.0.0/get/hotelcontent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          GetHotelContentRQ: {
            version: '3.0.0',
            HotelRefs: { HotelRef: [{ HotelCode: hotelCode }] },
            ContentTypes: { Images: { SizeType: 'LARGE' } }
          }
        }),
      });

      const data = await response.json();
      const images = data.GetHotelContentRS?.HotelContents?.HotelContent?.[0]?.Images?.Image || [];

      // Filter and sort by quality
      const curatedImages = images
        .filter((img: any) => !img.Category?.toLowerCase().includes('map'))
        .filter((img: any) => img.Width >= 800)
        .slice(0, 10)
        .map((img: any) => img.Url);

      if (curatedImages.length > 0) {
        await prisma.luxuryHotelImage.upsert({
          where: { hotelCode },
          update: {
            heroImage: curatedImages[0],
            images: curatedImages,
          },
          create: {
            hotelCode,
            heroImage: curatedImages[0],
            images: curatedImages,
          },
        });
        console.log(`  ✅ Saved ${curatedImages.length} images`);
      }
    } catch (error) {
      console.error(`  ❌ Failed for ${hotelCode}:`, error);
    }
  }
}

curateLuxuryImages()
  .then(() => console.log('Done!'))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## Implementation Order

1. **`src/components/providers/QueryProvider.tsx`** - Create provider (required first)
2. **`src/app/layout.tsx`** - Wrap with QueryProvider
3. **`src/hooks/useHotelImage.ts`** - Create the hook
4. **`src/app/api/hotel/media/route.ts`** - Create fallback API
5. **Test** - Verify lazy loading works for hotels without images
6. **`prisma/schema.prisma`** - Add LuxuryHotelImage model (Phase 2)
7. **Run migration** - `npx prisma migrate dev`
8. **`src/lib/services/hotel-enricher.ts`** - Add database lookup
9. **`scripts/curate-luxury-images.ts`** - Create curation script
10. **Run curation** - Populate database with luxury hotel images

---

## Testing Checklist

### Phase 1 (Already Done)
- [x] Images load from Sabre search response
- [x] Map images filtered out
- [x] Next.js Image optimization working
- [x] Fallback placeholder for missing images

### TanStack Query Infrastructure
- [ ] QueryProvider wraps app
- [ ] No hydration errors
- [ ] React Query DevTools working (optional)

### Lazy Loading Hook
- [ ] Hook fetches images for hotels without thumbnails
- [ ] 24-hour cache prevents repeat requests
- [ ] Fallback shows while loading

### Phase 2 Database Override
- [ ] Migration runs successfully
- [ ] Enricher checks database first
- [ ] Curated images override Sabre images
- [ ] Script populates luxury hotel images

---

## Notes

- **Sabre V5 MediaItems Limitation:** Not all hotels return images in search response. The lazy loading hook handles these cases.
- **Image Domain:** `vcmp-hotels.sabre.com` is already whitelisted in `next.config.ts`
- **TanStack Query** is already installed (`@tanstack/react-query: ^5.90.16`)
- **Axios** is already installed for HTTP requests
- **Prisma** is configured and working

---

## Files Reference

### Already Configured (Phase 1)
```
next.config.ts                           # Image domains ✅
src/lib/sabre/search.ts                  # getHeroImage(), MediaItems parsing ✅
src/components/voice/ResortCard.tsx      # Next.js Image component ✅
```

### To Create/Modify (Phase 2)
```
src/components/providers/QueryProvider.tsx  # NEW - Query provider
src/app/layout.tsx                          # MODIFY - Wrap with provider
src/hooks/useHotelImage.ts                  # NEW - Lazy loading hook
src/app/api/hotel/media/route.ts            # NEW - Fallback media API
prisma/schema.prisma                        # MODIFY - Add LuxuryHotelImage
src/lib/services/hotel-enricher.ts          # MODIFY - Database lookup
scripts/curate-luxury-images.ts             # NEW - Curation script
```
