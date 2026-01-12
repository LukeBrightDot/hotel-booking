import { NextResponse } from 'next/server';
import { testAuthentication } from '@/lib/sabre/auth';

export async function GET() {
  const result = await testAuthentication();

  if (result.success) {
    return NextResponse.json({
      status: 'success',
      message: `Authentication successful using ${result.version}`,
      version: result.version,
    });
  }

  return NextResponse.json({
    status: 'error',
    message: 'Authentication failed',
    error: result.error,
  }, { status: 500 });
}
