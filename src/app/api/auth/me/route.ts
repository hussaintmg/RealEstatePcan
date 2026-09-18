import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { getNormalizedFeatures } from '@/lib/features/registry';
import { PERMISSION_REGISTRY } from '@/lib/permissions/registry';
import { can, getEffectiveScope } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.userId).select('-passwordHash').lean();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let role: any = null;
  if (user.roleId) {
    role = await Role.findById(user.roleId).lean();
  }

  // Fetch and normalize system features
  const config = await SystemConfig.findOne().select('features').lean();
  const effectiveFeatures = getNormalizedFeatures(config?.features || {});

  // Compute effective permissions and scopes for the authenticated user
  const effectivePermissions: Record<string, boolean> = {};
  const effectiveScopes: Record<string, string> = {};

  for (const perm of PERMISSION_REGISTRY) {
    const isPermitted = can(session, role, perm.key);
    effectivePermissions[perm.key] = isPermitted;
    if (isPermitted) {
      effectiveScopes[perm.key] = getEffectiveScope(session, role, perm.key);
    }
  }

  const res = NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      role,
    },
    effectiveFeatures,
    effectivePermissions,
    effectiveScopes,
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  return res;
}
