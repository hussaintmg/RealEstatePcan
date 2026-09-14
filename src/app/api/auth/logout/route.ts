import { NextResponse } from 'next/server';
import { createClearAuthCookieHeader } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.headers.set('Set-Cookie', createClearAuthCookieHeader());
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return response;
}
