import { NextResponse } from 'next/server';
import { getSetupStatus } from '@/lib/setupService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getSetupStatus();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to determine setup status',
      },
      { status: 500 }
    );
  }
}
