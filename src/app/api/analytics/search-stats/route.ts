import { NextRequest, NextResponse } from 'next/server';
import { getSearchStats, getLuxuryStats } from '@/lib/services/search-logger';

/**
 * GET /api/analytics/search-stats
 *
 * Returns search statistics and luxury hotel appearance rates
 *
 * Query params:
 *   ?days=30 (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get search and luxury statistics
    const [searchStats, luxuryStats] = await Promise.all([
      getSearchStats(days),
      getLuxuryStats(days),
    ]);

    if (!searchStats || !luxuryStats) {
      return NextResponse.json(
        { error: 'Failed to retrieve statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      period: `Last ${days} days`,
      search: searchStats,
      luxury: luxuryStats,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
