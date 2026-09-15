import { NextRequest, NextResponse } from 'next/server';
import { proxyHandler } from './lib/proxy';

export async function middleware(req: NextRequest) {
  return proxyHandler(req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/uploads or public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads|models|textures).*)',
  ],
};
