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

    // Sabre GetHotelContent endpoint for images
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
      const category = (img.Category || '').toLowerCase();
      return !category.includes('map') &&
             (category.includes('exterior') || category.includes('lobby'));
    }) || images.find((img: any) =>
      !(img.Category || '').toLowerCase().includes('map')
    );

    return NextResponse.json(
      { url: heroImage?.Url || null },
      { headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } }
    );
  } catch (error) {
    console.error('Media API error:', error);
    return NextResponse.json({ url: null });
  }
}
