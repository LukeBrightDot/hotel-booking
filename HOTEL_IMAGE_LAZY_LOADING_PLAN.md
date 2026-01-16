# Hotel Image Lazy Loading Implementation Plan

## Context
We need to implement lazy loading for hotel images. The Sabre v5 search API returns images
in `MediaContent.Images.Image[]`, but we may need to fetch them separately via GetHotelMediaRQ.
Currently using native `<img>` tags - switching to Next.js Image with TanStack Query caching.

## Current State (Verified)
- Images come from search response: `hotel.thumbnail` and `hotel.images[]`
- Native `<img>` with `loading="lazy"` at `src/app/results/page.tsx:221-226`
- `@tanstack/react-query` and `axios` already installed
- Auth uses `getAuthToken()` from `src/lib/sabre/auth.ts`
- `next.config.ts` is empty (no image domains configured)
- `layout.tsx` has NO QueryClientProvider wrapper

## Files to Create/Modify

### 1. Configure Next.js Image Domains
**File:** `next.config.ts` (MODIFY)

Add image remote patterns for Sabre CDN and fallback:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.sabre.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },  // Common CDN for hotel images
    ],
  },
};

export default nextConfig;
```

### 2. Create QueryClient Provider
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

### 3. Wrap App with QueryProvider
**File:** `src/app/layout.tsx` (MODIFY)

Add QueryProvider import and wrap children:
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

### 4. Create Media Fetcher Service
**File:** `src/lib/services/media-fetcher.ts` (CREATE)

```typescript
import { getAuthToken, getApiBaseUrl } from '@/lib/sabre/auth';

interface SabreMediaResponse {
  GetHotelMediaRS?: {
    HotelMediaInfo?: {
      MediaContent?: {
        Images?: {
          Image?: Array<{
            Type?: string;
            Url?: string;
            Width?: number;
            Height?: number;
          }>;
        };
      };
    };
  };
}

export async function fetchBestHotelImage(hotelId: string): Promise<string | null> {
  try {
    const token = await getAuthToken();
    const baseUrl = getApiBaseUrl();

    // Sabre GetHotelMedia endpoint
    const response = await fetch(`${baseUrl}/v1/shop/hotels/media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        GetHotelMediaRQ: {
          HotelRefs: {
            HotelRef: [{ HotelCode: hotelId }]
          },
          ImageSize: {
            Width: 800,
            Height: 600
          }
        }
      }),
    });

    if (!response.ok) {
      console.error(`Media fetch failed for ${hotelId}: ${response.status}`);
      return null;
    }

    const data: SabreMediaResponse = await response.json();
    const images = data.GetHotelMediaRS?.HotelMediaInfo?.MediaContent?.Images?.Image || [];

    // Priority: EXTERIOR > LOBBY > first available
    const exterior = images.find(img => img.Type?.toUpperCase() === 'EXTERIOR');
    const lobby = images.find(img => img.Type?.toUpperCase() === 'LOBBY');

    return exterior?.Url || lobby?.Url || images[0]?.Url || null;
  } catch (error) {
    console.error(`Error fetching media for hotel ${hotelId}:`, error);
    return null;
  }
}
```

### 5. Create API Route (Backend Proxy)
**File:** `src/app/api/hotel/media/route.ts` (CREATE)

```typescript
import { NextResponse } from 'next/server';
import { fetchBestHotelImage } from '@/lib/services/media-fetcher';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('id');

  if (!hotelId) {
    return NextResponse.json({ url: null }, { status: 400 });
  }

  try {
    const imageUrl = await fetchBestHotelImage(hotelId);

    return NextResponse.json(
      { url: imageUrl },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400'  // 24 hours
        }
      }
    );
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json({ url: null }, { status: 500 });
  }
}
```

### 6. Create useHotelImage Hook
**File:** `src/hooks/useHotelImage.ts` (CREATE)

```typescript
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const PLACEHOLDER_IMAGE = '/images/placeholders/hotel-default.jpg';

export function useHotelImage(hotelId: string, initialUrl?: string | null) {
  return useQuery({
    queryKey: ['hotel-media', hotelId],
    queryFn: async () => {
      const { data } = await axios.get<{ url: string | null }>(
        `/api/hotel/media?id=${hotelId}`
      );
      return data.url || PLACEHOLDER_IMAGE;
    },
    enabled: !initialUrl,  // Don't fetch if we already have an image
    staleTime: 1000 * 60 * 60 * 24,  // 24 hours
    gcTime: 1000 * 60 * 60 * 24,     // Keep in cache 24 hours
    initialData: initialUrl || undefined,
    retry: 1,  // Only retry once on failure
  });
}
```

### 7. Create HotelCardImage Component
**File:** `src/components/hotel/HotelCardImage.tsx` (CREATE)

```typescript
'use client';

import { useHotelImage } from '@/hooks/useHotelImage';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface HotelCardImageProps {
  hotelId: string;
  alt: string;
  initialImage?: string | null;
  className?: string;
  priority?: boolean;  // For above-the-fold images
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

export function HotelCardImage({
  hotelId,
  alt,
  initialImage,
  className,
  priority = false
}: HotelCardImageProps) {
  const { data: imageUrl, isLoading, isError } = useHotelImage(hotelId, initialImage);

  const displayImage = isError ? FALLBACK_IMAGE : (imageUrl || initialImage || FALLBACK_IMAGE);

  return (
    <div className={cn("relative w-full md:w-64 h-48 bg-gray-100 overflow-hidden", className)}>
      <Image
        src={displayImage}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 256px"
        priority={priority}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading && !initialImage ? "opacity-0" : "opacity-100"
        )}
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />

      {/* Loading skeleton - only show if no initial image */}
      {isLoading && !initialImage && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}
    </div>
  );
}
```

### 8. Create Placeholder Image
**File:** `public/images/placeholders/hotel-default.jpg` (CREATE)

Download a generic hotel placeholder image or create a simple SVG placeholder.
For now, the component falls back to Unsplash URL if local file missing.

### 9. Update Results Page
**File:** `src/app/results/page.tsx` (MODIFY)

Replace lines 221-226 (the current `<img>` tag):

FROM:
```tsx
<img
  src={hotel.thumbnail}
  alt={hotel.hotelName}
  className="w-full md:w-64 h-48 object-cover"
  loading="lazy"
/>
```

TO:
```tsx
<HotelCardImage
  hotelId={hotel.hotelCode}
  alt={hotel.hotelName}
  initialImage={hotel.thumbnail}
  priority={index < 4}  // Load first 4 images immediately
/>
```

Add import at top of file:
```typescript
import { HotelCardImage } from '@/components/hotel/HotelCardImage';
```

Note: You'll need access to `index` from the map function. Change:
```tsx
{filteredHotels.map((hotel) => (
```
to:
```tsx
{filteredHotels.map((hotel, index) => (
```

## Implementation Order

1. `next.config.ts` - Add image domains (required first)
2. `src/components/providers/QueryProvider.tsx` - Create provider
3. `src/app/layout.tsx` - Wrap with QueryProvider
4. `src/lib/services/media-fetcher.ts` - Create Sabre media service
5. `src/app/api/hotel/media/route.ts` - Create API route
6. `src/hooks/useHotelImage.ts` - Create the hook
7. `src/components/hotel/HotelCardImage.tsx` - Create component
8. `src/app/results/page.tsx` - Update to use new component

## Testing

After implementation, run:
```bash
npm run dev
```

Then:
1. Navigate to search results page
2. Check Network tab - images should load via `/api/hotel/media?id=xxx`
3. Verify caching - reload page, images should come from cache (no new API calls)
4. Check fallback - block an image URL, should show placeholder

## Notes

- The Sabre GetHotelMedia endpoint path (`/v1/shop/hotels/media`) may need verification
- If Sabre doesn't have a separate media endpoint, remove the media-fetcher and API route,
  and just use the `initialImage` prop (images from search response)
- The `hotel.thumbnail` from search results should work for most cases
- TanStack Query will dedupe requests for the same hotelId automatically
