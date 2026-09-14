import { NextRequest, NextResponse } from 'next/server';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { getSessionUser } from '@/lib/auth';
import { executeGlobalSearch } from '@/lib/search/globalSearchService';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // 1. Verify feature flag
  const featureCheck = await verifyFeatureAllowed('globalSearch');
  if (featureCheck) return featureCheck;

  // 2. Authenticate
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get('q') || '';
  if (!query.trim()) {
    return NextResponse.json({ success: true, results: [] });
  }

  try {
    const results = await executeGlobalSearch(query, user);

    recordAuditEvent({
      method: 'GET',
      path: '/api/search/global',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
