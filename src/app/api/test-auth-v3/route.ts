import { NextRequest, NextResponse } from 'next/server';
import { authenticateV3, authenticateV2 } from '@/lib/sabre/auth';

export async function GET(request: NextRequest) {
  const results = {
    v3: {
      success: false,
      responseTime: 0,
      error: null as string | null,
      version: null as string | null,
    },
    v2: {
      success: false,
      responseTime: 0,
      error: null as string | null,
      version: null as string | null,
    },
  };

  // Test V3 Authentication
  try {
    console.log('Testing V3 authentication...');
    const start = performance.now();
    const tokenData = await authenticateV3();
    results.v3.responseTime = performance.now() - start;
    results.v3.success = true;
    results.v3.version = tokenData.version;
    console.log(`✅ V3 authentication successful (${results.v3.responseTime.toFixed(0)}ms)`);
  } catch (error) {
    results.v3.responseTime = 0;
    results.v3.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ V3 authentication failed:', results.v3.error);
  }

  // Test V2 Authentication (for comparison)
  try {
    console.log('Testing V2 authentication...');
    const start = performance.now();
    const tokenData = await authenticateV2();
    results.v2.responseTime = performance.now() - start;
    results.v2.success = true;
    results.v2.version = tokenData.version;
    console.log(`✅ V2 authentication successful (${results.v2.responseTime.toFixed(0)}ms)`);
  } catch (error) {
    results.v2.responseTime = 0;
    results.v2.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ V2 authentication failed:', results.v2.error);
  }

  // Determine winner
  const winner =
    results.v3.success && results.v2.success
      ? results.v3.responseTime < results.v2.responseTime ? 'V3' : 'V2'
      : results.v3.success ? 'V3' : results.v2.success ? 'V2' : null;

  return NextResponse.json({
    ...results,
    comparison: {
      winner,
      timeDifference: results.v3.success && results.v2.success
        ? Math.abs(results.v3.responseTime - results.v2.responseTime)
        : null,
      v3Advantage: results.v3.success && results.v2.success
        ? ((results.v2.responseTime / results.v3.responseTime - 1) * 100).toFixed(1) + '%'
        : null,
    },
  });
}
