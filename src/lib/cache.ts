/**
 * Simple in-memory cache for API responses
 * Optimizes performance by reducing redundant API calls
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.startCleanup();
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with TTL (time to live) in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlMs,
    });
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const total = this.cache.size;
    const expired = Array.from(this.cache.values()).filter(
      entry => now > entry.expires
    ).length;

    return {
      total,
      active: total - expired,
      expired,
    };
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    if (this.cleanupInterval) {
      return;
    }

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expires) {
          this.cache.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance
export const cache = new SimpleCache();

/**
 * Generate cache key for hotel search results
 */
export function generateSearchCacheKey(params: {
  location: any;
  checkIn: string;
  checkOut: string;
  rooms?: number;
  adults?: number;
}): string {
  const locationKey = typeof params.location === 'string'
    ? params.location
    : params.location.code || params.location.name || 'unknown';

  return `search:${locationKey}:${params.checkIn}:${params.checkOut}:${params.rooms || 1}:${params.adults || 2}`;
}

/**
 * Generate cache key for hotel details
 */
export function generateHotelDetailsCacheKey(hotelCode: string): string {
  return `hotel:${hotelCode}`;
}

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  SEARCH_RESULTS: 10 * 60 * 1000,  // 10 minutes
  HOTEL_DETAILS: 60 * 60 * 1000,   // 1 hour
  AUTH_TOKEN: 50 * 60 * 1000,       // 50 minutes (5-min buffer from 55-min expiry)
};
