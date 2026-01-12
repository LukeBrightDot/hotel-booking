import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/sabre/auth';

export async function GET(request: NextRequest) {
  try {
    const token = await getAuthToken();

    return NextResponse.json({
      token,
      success: true,
    });
  } catch (error) {
    console.error('Token retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get auth token',
      },
      { status: 500 }
    );
  }
}
