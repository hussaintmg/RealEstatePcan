import { NextRequest, NextResponse } from 'next/server';
import { classifyRoute, isStaticAsset } from './routes';
import { parseTokenPayload, AUTH_COOKIE_NAME } from './session';

// In-memory module cache for setup status (once completed, it remains true)
let isSetupCompletedCache: boolean | null = null;
let lastSetupCheckTime = 0;
const SETUP_CACHE_TTL_MS = 5000; // Cache check every 5s while setup is incomplete

export async function checkSetupStatusCached(req: NextRequest): Promise<boolean> {
  // 1. Check client/proxy setup cookie for instant acknowledgement
  if (req.cookies.get('platform_setup_status')?.value === 'completed') {
    isSetupCompletedCache = true;
    return true;
  }

  // 2. An authenticated user (e.g. Developer Admin, Owner) guarantees setup was completed
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    const session = parseTokenPayload(token);
    if (session?.userId) {
      isSetupCompletedCache = true;
      return true;
    }
  }

  const now = Date.now();
  if (isSetupCompletedCache !== null && now - lastSetupCheckTime < SETUP_CACHE_TTL_MS) {
    return isSetupCompletedCache;
  }

  try {
    const url = new URL('/api/setup/status', req.url);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url.toString(), {
      headers: { 'x-middleware-check': '1' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      isSetupCompletedCache = !!data.setupCompleted;
      lastSetupCheckTime = now;
      return isSetupCompletedCache;
    }
  } catch {
    // If status check fails (e.g. cold start), fallback to cache or false
  }

  return isSetupCompletedCache ?? false;
}

export function resetSetupCache() {
  isSetupCompletedCache = null;
  lastSetupCheckTime = 0;
}

export function markSetupCompleted() {
  isSetupCompletedCache = true;
  lastSetupCheckTime = Date.now();
}

export async function proxyHandler(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 1. Static asset bypass
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // 2. Setup & Auth API bypass
  if (
    pathname === '/api/setup/status' ||
    pathname === '/api/setup/initialize' ||
    pathname === '/api/setup/upload' ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/properties/seed-demo'
  ) {
    return NextResponse.next();
  }

  // 3. Fast Setup Gating
  const setupCompleted = await checkSetupStatusCached(req);

  if (!setupCompleted) {
    // Never redirect API calls to a web page (prevents 405 Method Not Allowed on POST)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { code: 'SETUP_REQUIRED', message: 'Platform setup has not been completed.' },
        { status: 503 }
      );
    }

    // If setup is NOT completed, only allow /setup and public setup assets
    if (pathname !== '/setup') {
      const setupUrl = new URL('/setup', req.url);
      return NextResponse.redirect(setupUrl);
    }
    return NextResponse.next();
  }

  // 4. Setup IS completed: prevent re-accessing /setup
  if (pathname === '/setup') {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const session = token ? parseTokenPayload(token) : null;

    if (session) {
      const dest = session.isDeveloper
        ? '/dashboard/developer'
        : session.isOwner
        ? '/dashboard/owner'
        : '/dashboard/properties';
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 5. Auth Token Inspection (Dynamic Cookie Reading - No Physical File Modification)
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? parseTokenPayload(token) : null;

  // 6. If already logged in and visiting /login -> redirect to dashboard
  if (pathname === '/login' && session) {
    const dest = session.isDeveloper
      ? '/dashboard/developer'
      : session.isOwner
      ? '/dashboard/owner'
      : session.roleId
      ? '/dashboard/properties'
      : '/portal';
    return NextResponse.redirect(new URL(dest, req.url));
  }

  // 7. Route classification & Dashboard Route Protection
  const category = classifyRoute(pathname);

  // If attempting to access any /dashboard route without a valid session -> redirect to /login
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const loginUrl = new URL('/login', req.url);
      // Clean redirect without exposing internal tokens in query params
      return NextResponse.redirect(loginUrl);
    }

    // Role-Aware Fast Gating
    if (category === 'developer' && !session.isDeveloper) {
      const fallbackUrl = session.isOwner
        ? new URL('/dashboard/owner', req.url)
        : new URL('/dashboard/properties', req.url);
      return NextResponse.redirect(fallbackUrl);
    }

    if (category === 'owner' && !session.isOwner && !session.isDeveloper) {
      const fallbackUrl = new URL('/dashboard/properties', req.url);
      return NextResponse.redirect(fallbackUrl);
    }
  }

  // Forward response with anti-cache headers for protected views
  const response = NextResponse.next();
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }

  return response;
}
