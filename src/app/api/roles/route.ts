import { NextRequest, NextResponse } from 'next/server';
import { requireUser, standardError } from '@/lib/authGuard';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { can, invalidateRoleCache } from '@/lib/rbac';
import { validateAndNormalizeAssignments } from '@/lib/permissions/registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const allowed =
    authRes.user.isDeveloper ||
    authRes.user.isOwner ||
    can(authRes.user, authRes.role, 'roles.manage');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: roles.manage required', 403);
  }

  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get('status') || undefined;

  const query: Record<string, any> = {};
  if (statusFilter && statusFilter !== 'all') {
    query.status = statusFilter;
  }

  const roles = await Role.find(query).sort({ createdAt: -1 }).lean();

  // Attach user count to each role
  const userCounts = await User.aggregate([
    { $match: { roleId: { $ne: null } } },
    { $group: { _id: '$roleId', count: { $sum: 1 } } },
  ]);

  const userCountMap = new Map<string, number>();
  for (const uc of userCounts) {
    if (uc._id) {
      userCountMap.set(uc._id.toString(), uc.count);
    }
  }

  const enrichedRoles = roles.map((role) => ({
    ...role,
    userCount: userCountMap.get(role._id.toString()) || 0,
  }));

  return NextResponse.json({ success: true, roles: enrichedRoles });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const allowed =
    authRes.user.isDeveloper ||
    authRes.user.isOwner ||
    can(authRes.user, authRes.role, 'roles.manage');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: roles.manage required', 403);
  }

  await connectToDatabase();
  const body = await req.json();

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    return standardError('VALIDATION_ERROR', 'Role name is required and cannot be blank', 422, {
      name: 'Role name is required',
    });
  }

  // Validate and normalize capability assignments
  let normalizedCapabilities = [];
  if (Array.isArray(body.capabilities)) {
    const validation = validateAndNormalizeAssignments(body.capabilities);
    if (validation.errors.length > 0) {
      return standardError('VALIDATION_ERROR', validation.errors.join(', '), 422);
    }
    normalizedCapabilities = validation.normalized;
  }

  try {
    const role = await Role.create({
      name: body.name.trim(),
      description: body.description || '',
      dataScope: body.dataScope || 'own_data',
      capabilities: normalizedCapabilities,
      permissions: body.permissions || [],
      createdBy: authRes.user.userId,
      status: body.status || 'active',
      isSystem: false,
    });

    invalidateRoleCache();

    recordAuditEvent({
      actorUserId: authRes.user.userId,
      actorEmail: authRes.user.email,
      actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
      action: 'role.created',
      resourceType: 'role',
      resourceId: role._id.toString(),
      route: '/api/roles',
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, {
        name: role.name,
        capabilities: role.capabilities,
        dataScope: role.dataScope,
      }),
      metadata: { roleName: role.name },
    });

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (err: any) {
    return standardError('ROLE_CREATE_FAILED', err.message || 'Failed to create role', 500);
  }
}
