import { NextResponse } from 'next/server';
import { getSessionUser, TokenPayload, AUTH_COOKIE_NAME } from './auth';
import { getUserRole, hasPermission, can } from './rbac';
import { connectToDatabase } from './db';
import { SystemConfig } from '../models/SystemConfig';

export interface StandardApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
  requestId: string;
}

export function standardError(
  code: string,
  message: string,
  status: number = 400,
  fieldErrors?: Record<string, string>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const body: StandardApiError = {
    code,
    message,
    requestId,
  };
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    body.fieldErrors = fieldErrors;
  }
  return NextResponse.json(body, { status });
}

export async function getAuthContext(req?: any): Promise<{ user: TokenPayload; role: any } | null> {
  try {
    let tokenOverride: string | undefined;
    if (req && req.cookies && typeof req.cookies.get === 'function') {
      tokenOverride = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    }
    const sessionUser = await getSessionUser(tokenOverride);
    if (!sessionUser) return null;
    const role = await getUserRole(sessionUser.roleId);
    return { user: sessionUser, role };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<
  { user: TokenPayload; role: any | null; error: null } | { user: null; role: null; error: NextResponse }
> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return {
      user: null,
      role: null,
      error: standardError('AUTH_UNAUTHORIZED', 'Authentication is required to access this resource', 401),
    };
  }
  const role = await getUserRole(sessionUser.roleId);
  return { user: sessionUser, role, error: null };
}

export async function requireDeveloper(): Promise<
  { user: TokenPayload; role: any | null; error: null } | { user: null; role: null; error: NextResponse }
> {
  const authRes = await requireUser();
  if (authRes.error) return authRes;

  if (!authRes.user.isDeveloper) {
    return {
      user: null,
      role: null,
      error: standardError('AUTH_FORBIDDEN', 'Developer authority required for this operation', 403),
    };
  }

  return authRes;
}

export async function requireOwner(): Promise<
  { user: TokenPayload; role: any | null; error: null } | { user: null; role: null; error: NextResponse }
> {
  const authRes = await requireUser();
  if (authRes.error) return authRes;

  if (!authRes.user.isOwner && !authRes.user.isDeveloper) {
    return {
      user: null,
      role: null,
      error: standardError('AUTH_FORBIDDEN', 'Owner or Developer authority required for this operation', 403),
    };
  }

  return authRes;
}

interface CachedFeatureEntry {
  features: Record<string, boolean>;
  timestamp: number;
}

let cachedFeatures: CachedFeatureEntry | null = null;
const FEATURE_CACHE_TTL_MS = 15000; // 15 seconds

export function invalidateFeatureCache() {
  cachedFeatures = null;
}

export async function getCachedSystemFeatures(): Promise<Record<string, boolean>> {
  const now = Date.now();
  if (cachedFeatures && (now - cachedFeatures.timestamp) < FEATURE_CACHE_TTL_MS) {
    return cachedFeatures.features;
  }

  await connectToDatabase();
  const config = await SystemConfig.findOne().select('features').lean();
  const features: Record<string, boolean> = (config?.features as any) || {};
  cachedFeatures = { features, timestamp: now };
  return features;
}

/**
 * Enforces that a specific platform or workspace feature flag is currently active.
 */
export async function requireFeature(
  featureKey: string
): Promise<{ allowed: boolean; error: NextResponse | null }> {
  const features = await getCachedSystemFeatures();

  // If explicitly disabled, reject with 403
  if (features[featureKey] === false) {
    return {
      allowed: false,
      error: standardError(
        'FEATURE_DISABLED',
        `The requested feature '${featureKey}' is currently disabled on this platform`,
        403
      ),
    };
  }

  return { allowed: true, error: null };
}

/**
 * Enforces a business capability permission (e.g. 'property.create', 'customer.edit').
 * Can also evaluate resource-level scoping when a resource entity is provided.
 */
export async function requireCapability(
  capabilityKey: string,
  resource?: any
): Promise<
  { user: TokenPayload; role: any | null; error: null } | { user: null; role: null; error: NextResponse }
> {
  const authRes = await requireUser();
  if (authRes.error) return authRes;

  const allowed = can(authRes.user, authRes.role, capabilityKey, resource);
  if (!allowed) {
    return {
      user: null,
      role: null,
      error: standardError(
        'RBAC_PERMISSION_DENIED',
        `Permission denied: Cannot execute capability '${capabilityKey}'`,
        403
      ),
    };
  }

  return authRes;
}

/**
 * Supports both modern capability keys (e.g. requirePermission('lead.view'))
 * and legacy page-action calls (e.g. requirePermission('leads', 'read')).
 */
export async function requirePermission(
  pageOrCapability: string,
  legacyAction?: 'create' | 'read' | 'update' | 'delete' | 'download_pdf' | 'send_email' | 'send_whatsapp',
  resource?: any
): Promise<
  { user: TokenPayload; role: any | null; error: null } | { user: null; role: null; error: NextResponse }
> {
  if (legacyAction) {
    const authRes = await requireUser();
    if (authRes.error) return authRes;

    const allowed = hasPermission(authRes.user, authRes.role, pageOrCapability, legacyAction);
    if (!allowed) {
      return {
        user: null,
        role: null,
        error: standardError(
          'RBAC_PERMISSION_DENIED',
          `Permission denied: Cannot perform '${legacyAction}' on '${pageOrCapability}'`,
          403
        ),
      };
    }
    return authRes;
  }

  return requireCapability(pageOrCapability, resource);
}
