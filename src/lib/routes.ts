/**
 * Centralized Route Access Matrix & Route Classification
 */

export const ROUTE_PATTERNS = {
  // Static assets & internal Next.js assets that should always be bypassed
  static: [
    /^\/_next\//,
    /^\/favicon\.ico$/,
    /^\/uploads\//,
    /^\/images\//,
    /^\/assets\//,
    /^\/models\//,
    /^\/textures\//,
    /\.(png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|wasm|bin|gltf|glb|json|css|js)$/i,
  ],

  // Public visitor pages
  public: [
    /^\/$/,
    /^\/properties(\/.*)?$/,
    /^\/about(\/.*)?$/,
    /^\/contact(\/.*)?$/,
    /^\/3d-experience(\/.*)?$/,
    /^\/investment(\/.*)?$/,
    /^\/locations(\/.*)?$/,
    /^\/private-viewing(\/.*)?$/,
    /^\/viewer(\/.*)?$/,
  ],

  // Auth pages & public auth endpoints
  auth: [
    /^\/login$/,
    /^\/api\/auth\/login$/,
    /^\/api\/auth\/logout$/,
    /^\/api\/auth\/bootstrap$/,
    /^\/api\/auth\/me$/,
  ],

  // Setup wizard & public setup endpoints
  setup: [
    /^\/setup$/,
    /^\/api\/setup\/status$/,
    /^\/api\/setup\/initialize$/,
    /^\/api\/setup\/upload$/,
  ],

  // Developer exclusive routes
  developer: [
    /^\/dashboard\/developer(\/.*)?$/,
    /^\/api\/developer(\/.*)?$/,
  ],

  // Owner exclusive or owner-level routes
  owner: [
    /^\/dashboard\/owner(\/.*)?$/,
    /^\/api\/owner(\/.*)?$/,
  ],

  // CMS studio routes
  cms: [
    /^\/dashboard\/cms(\/.*)?$/,
    /^\/api\/cms(\/.*)?$/,
  ],

  // Staff operational dashboard pages
  staff: [
    /^\/dashboard\/(properties|leads|customers|deals|appointments|invoices|payments|roles|templates|users|audit)(\/.*)?$/,
    /^\/api\/(properties|leads|customers|deals|appointments|invoices|payments|roles|templates|storage|users|crm|portal|audit-logs)(\/.*)?$/,
  ],

  // Client customer portal
  customerPortal: [
    /^\/portal(\/.*)?$/,
    /^\/c\/(.*)?$/,
    /^\/api\/customer(\/.*)?$/,
  ],
};

export type RouteCategory =
  | 'static'
  | 'public'
  | 'auth'
  | 'setup'
  | 'developer'
  | 'owner'
  | 'cms'
  | 'staff'
  | 'customerPortal'
  | 'unknown';

export function classifyRoute(pathname: string): RouteCategory {
  if (ROUTE_PATTERNS.static.some((regex) => regex.test(pathname))) {
    return 'static';
  }
  if (ROUTE_PATTERNS.setup.some((regex) => regex.test(pathname))) {
    return 'setup';
  }
  if (ROUTE_PATTERNS.auth.some((regex) => regex.test(pathname))) {
    return 'auth';
  }
  if (ROUTE_PATTERNS.developer.some((regex) => regex.test(pathname))) {
    return 'developer';
  }
  if (ROUTE_PATTERNS.owner.some((regex) => regex.test(pathname))) {
    return 'owner';
  }
  if (ROUTE_PATTERNS.cms.some((regex) => regex.test(pathname))) {
    return 'cms';
  }
  if (ROUTE_PATTERNS.staff.some((regex) => regex.test(pathname))) {
    return 'staff';
  }
  if (ROUTE_PATTERNS.customerPortal.some((regex) => regex.test(pathname))) {
    return 'customerPortal';
  }
  if (ROUTE_PATTERNS.public.some((regex) => regex.test(pathname))) {
    return 'public';
  }
  return 'unknown';
}

export function isProtectedRoute(pathname: string): boolean {
  const category = classifyRoute(pathname);
  return (
    category === 'developer' ||
    category === 'owner' ||
    category === 'cms' ||
    category === 'staff' ||
    category === 'customerPortal' ||
    pathname.startsWith('/dashboard')
  );
}

export function isStaticAsset(pathname: string): boolean {
  return ROUTE_PATTERNS.static.some((regex) => regex.test(pathname));
}

export function isSetupRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.setup.some((regex) => regex.test(pathname));
}

export function isAuthRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.auth.some((regex) => regex.test(pathname));
}
