import { NextResponse } from 'next/server';
import { getSessionUser, createClearAuthCookieHeader } from '@/lib/auth';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST() {
  const session = await getSessionUser();
  if (session) {
    recordAuditEvent({
      method: 'POST',
      path: '/api/auth/logout',
      statusCode: 200,
      durationMs: 0,
      userId: session.userId,
      userEmail: session.email,
      error: 'auth.logout',
    });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
    redirectPath: '/login',
  });

  response.headers.set('Set-Cookie', createClearAuthCookieHeader());
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
