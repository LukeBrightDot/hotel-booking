import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400';

/**
 * Hook for lazy loading hotel images.
 * Only fetches from API if no initialUrl is provided (i.e., search didn't return an image).
 */
export function useHotelImage(hotelId: string, initialUrl?: string | null) {
  return useQuery({
    queryKey: ['hotel-media', hotelId],
    queryFn: async () => {
      const { data } = await axios.get<{ url: string | null }>(
        `/api/hotel/media?id=${hotelId}`
      );
      return data.url || FALLBACK_IMAGE;
    },
    enabled: !initialUrl,  // Only fetch if no image from search response
    staleTime: 1000 * 60 * 60 * 24,  // 24 hours
    gcTime: 1000 * 60 * 60 * 24,     // Keep in garbage collection for 24h
    initialData: initialUrl || undefined,
    retry: 1,
  });
}
