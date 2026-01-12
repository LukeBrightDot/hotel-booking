import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/data/locations';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  // Minimum 2 characters for search
  if (query.length < 2) {
    return NextResponse.json({
      airports: [],
      cities: [],
      hotels: [],
    });
  }

  const results = searchLocations(query);

  return NextResponse.json(results);
}
