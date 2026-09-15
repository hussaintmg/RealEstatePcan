import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { PERMISSION_REGISTRY } from '@/lib/permissions/registry';
import { getNormalizedFeatures } from '@/lib/features/registry';
import { DataScope } from '@/lib/permissions/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();

  const config = await SystemConfig.findOne().lean();
  const session = await getSessionUser();

  const features = getNormalizedFeatures(config?.features as any);

  const baseConfig = {
    setupCompleted: !!config?.setupCompleted,
    features,
    branding: {
      websiteName: config?.branding?.websiteName || 'Aura Heights Luxury Estates',
      headerLogo: config?.branding?.headerLogo || '',
      footerLogo: config?.branding?.footerLogo || '',
      favicon: config?.branding?.favicon || '/favicon.ico',
      headerLogoLight: config?.branding?.headerLogoLight || '',
      headerLogoDark: config?.branding?.headerLogoDark || '',
      footerLogoLight: config?.branding?.footerLogoLight || '',
      footerLogoDark: config?.branding?.footerLogoDark || '',
    },
  };

  if (!session) {
    const res = NextResponse.json({
      authenticated: false,
      user: null,
      role: null,
      permissions: {},
      effectivePermissions: [],
      effectiveScopes: {},
      ...baseConfig,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  }

  const user = await User.findById(session.userId).select('-passwordHash').lean();
  if (!user || !user.isActive) {
    const res = NextResponse.json({
      authenticated: false,
      user: null,
      role: null,
      permissions: {},
      effectivePermissions: [],
      effectiveScopes: {},
      ...baseConfig,
    });
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res;
  }

  let role: any = null;
  const permissionsSummary: Record<string, Record<string, boolean>> = {};
  const effectivePermissions: string[] = [];
  const effectiveScopes: Record<string, DataScope> = {};

  if (user.isDeveloper) {
    // Developer gets all capability keys and 'all' scope
    for (const p of PERMISSION_REGISTRY) {
      effectivePermissions.push(p.key);
      effectiveScopes[p.key] = 'all';
    }
  } else if (user.isOwner) {
    // Owner gets all operational capability keys except system.configure
    for (const p of PERMISSION_REGISTRY) {
      if (p.key !== 'system.configure') {
        effectivePermissions.push(p.key);
        effectiveScopes[p.key] = 'all';
      }
    }
  } else if (user.roleId) {
    role = await Role.findById(user.roleId).lean();
    if (role) {
      // Modern capabilities
      if (Array.isArray(role.capabilities)) {
        for (const cap of role.capabilities) {
          if (cap.enabled) {
            effectivePermissions.push(cap.key);
            effectiveScopes[cap.key] = cap.scope || (role.dataScope === 'all_data' ? 'all' : 'own');
          }
        }
      }

      // Legacy page permissions summary
      if (Array.isArray(role.permissions)) {
        for (const p of role.permissions) {
          permissionsSummary[p.page] = {
            create: p.create,
            read: p.read,
            update: p.update,
            delete: p.delete,
            download_pdf: p.download_pdf,
            send_email: p.send_email,
            send_whatsapp: p.send_whatsapp,
          };
          // Also map into effectivePermissions if modern list was empty
          if (effectivePermissions.length === 0) {
            if (p.read) effectivePermissions.push(`${p.page}.view`, `${p.page}.list`);
            if (p.create) effectivePermissions.push(`${p.page}.create`);
            if (p.update) effectivePermissions.push(`${p.page}.edit`);
            if (p.delete) effectivePermissions.push(`${p.page}.archive`);
          }
        }
      }
    }
  }

  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      companyName: user.companyName || '',
      isDeveloper: user.isDeveloper,
      isOwner: user.isOwner,
      roleId: user.roleId ? user.roleId.toString() : undefined,
      createdAt: user.createdAt,
    },
    role: role
      ? {
          id: role._id.toString(),
          name: role.name,
          dataScope: role.dataScope,
          version: role.version || 1,
        }
      : null,
    permissions: permissionsSummary,
    effectivePermissions,
    effectiveScopes,
    ...baseConfig,
  });

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return response;
}
