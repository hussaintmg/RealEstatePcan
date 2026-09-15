import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { Role } from '@/models/Role';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { can } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid role ID format', 400);
  }

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
  const sourceRole = await Role.findById(id).lean();
  if (!sourceRole) {
    return standardError('ROLE_NOT_FOUND', 'Source role to clone not found', 404);
  }

  try {
    const cloneData = {
      name: `${sourceRole.name} (Copy)`,
      description: sourceRole.description ? `Copy of ${sourceRole.description}` : `Cloned from ${sourceRole.name}`,
      dataScope: sourceRole.dataScope || 'own_data',
      capabilities: sourceRole.capabilities ? JSON.parse(JSON.stringify(sourceRole.capabilities)) : [],
      permissions: sourceRole.permissions ? JSON.parse(JSON.stringify(sourceRole.permissions)) : [],
      createdBy: authRes.user.userId,
      isSystem: false,
      status: 'active',
      version: 1,
    };

    const newRole = await Role.create(cloneData);

    recordAuditEvent({
      actorUserId: authRes.user.userId,
      actorEmail: authRes.user.email,
      actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
      action: 'role.cloned',
      resourceType: 'role',
      resourceId: newRole._id.toString(),
      route: `/api/roles/${id}/clone`,
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, {
        clonedFromId: id,
        newRoleId: newRole._id.toString(),
        name: newRole.name,
      }),
      metadata: { sourceRoleId: id, newRoleName: newRole.name },
    });

    return NextResponse.json({ success: true, role: newRole }, { status: 201 });
  } catch (err: any) {
    return standardError('CLONE_FAILED', err.message || 'Failed to clone role', 500);
  }
}
