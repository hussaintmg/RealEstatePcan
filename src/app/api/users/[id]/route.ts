import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { can, invalidateRoleCache } from '@/lib/rbac';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid user ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const allowed =
    authRes.user.isDeveloper ||
    authRes.user.isOwner ||
    can(authRes.user, authRes.role, 'users.manage');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: users.manage required', 403);
  }

  await connectToDatabase();
  const targetUser = await User.findById(id)
    .select('-passwordHash')
    .populate('roleId', 'name description status version')
    .lean();

  if (!targetUser) {
    return standardError('USER_NOT_FOUND', 'User record not found', 404);
  }

  return NextResponse.json({
    success: true,
    user: {
      id: targetUser._id.toString(),
      _id: targetUser._id.toString(),
      fullName: targetUser.fullName,
      email: targetUser.email,
      phone: targetUser.phone || '',
      companyName: targetUser.companyName || '',
      isDeveloper: !!targetUser.isDeveloper,
      isOwner: !!targetUser.isOwner,
      roleId: targetUser.roleId?._id ? (targetUser.roleId as any)._id.toString() : null,
      role: targetUser.roleId,
      isActive: targetUser.isActive !== false,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid user ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const allowed =
    authRes.user.isDeveloper ||
    authRes.user.isOwner ||
    can(authRes.user, authRes.role, 'users.manage');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: users.manage required', 403);
  }

  await connectToDatabase();
  const targetUser = await User.findById(id);
  if (!targetUser) {
    return standardError('USER_NOT_FOUND', 'User record not found', 404);
  }

  // Safety protection: Non-developer cannot modify developer accounts
  if (targetUser.isDeveloper && !authRes.user.isDeveloper) {
    return standardError('FORBIDDEN', 'Only platform Developers can modify developer accounts', 403);
  }

  // Safety protection: Cannot demote or tamper with primary Owner account
  if (targetUser.isOwner && !authRes.user.isDeveloper && authRes.user.userId !== targetUser._id.toString()) {
    return standardError('FORBIDDEN', 'Cannot modify primary Owner account without appropriate authority', 403);
  }

  const body = await req.json();

  const beforeSnapshot = {
    fullName: targetUser.fullName,
    phone: targetUser.phone,
    roleId: targetUser.roleId?.toString(),
    isActive: targetUser.isActive,
  };

  if (body.fullName !== undefined) {
    if (typeof body.fullName !== 'string' || !body.fullName.trim()) {
      return standardError('VALIDATION_ERROR', 'Full name cannot be blank', 422);
    }
    targetUser.fullName = body.fullName.trim();
  }

  if (body.phone !== undefined) {
    targetUser.phone = String(body.phone).trim();
  }

  let roleChanged = false;
  if (body.roleId !== undefined) {
    // If setting to null or a new role
    if (body.roleId === null || body.roleId === '') {
      targetUser.roleId = undefined;
      roleChanged = true;
    } else {
      if (!mongoose.Types.ObjectId.isValid(body.roleId)) {
        return standardError('INVALID_ROLE_ID', 'Invalid role ID format', 422);
      }
      const role = await Role.findById(body.roleId);
      if (!role) {
        return standardError('ROLE_NOT_FOUND', 'Role not found', 404);
      }
      if (role.status === 'archived') {
        return standardError('ROLE_ARCHIVED', 'Cannot assign an archived role', 422);
      }
      if (targetUser.roleId?.toString() !== role._id.toString()) {
        targetUser.roleId = role._id as mongoose.Types.ObjectId;
        roleChanged = true;
      }
    }
  }

  if (typeof body.isActive === 'boolean') {
    // Prevent deactivating Developer or primary Owner
    if (!body.isActive && (targetUser.isDeveloper || targetUser.isOwner)) {
      return standardError('FORBIDDEN', 'Cannot deactivate Developer or primary Owner account', 403);
    }
    targetUser.isActive = body.isActive;
  }

  // Support password reset if requested by authorized admin
  if (body.password && typeof body.password === 'string' && body.password.length >= 8) {
    targetUser.passwordHash = await hashPassword(body.password);
  }

  await targetUser.save();
  invalidateRoleCache(targetUser.roleId?.toString());

  const afterSnapshot = {
    fullName: targetUser.fullName,
    phone: targetUser.phone,
    roleId: targetUser.roleId?.toString(),
    isActive: targetUser.isActive,
  };

  const action = roleChanged ? 'user.role.changed' : 'user.updated';

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action,
    resourceType: 'user',
    resourceId: targetUser._id.toString(),
    route: `/api/users/${id}`,
    method: 'PUT',
    status: 200,
    durationMs: Date.now() - startTime,
    changes: computeSafeDiff(beforeSnapshot, afterSnapshot),
    metadata: { targetEmail: targetUser.email, roleChanged },
  });

  return NextResponse.json({
    success: true,
    user: {
      id: targetUser._id.toString(),
      _id: targetUser._id.toString(),
      fullName: targetUser.fullName,
      email: targetUser.email,
      phone: targetUser.phone,
      companyName: targetUser.companyName,
      isDeveloper: targetUser.isDeveloper,
      isOwner: targetUser.isOwner,
      roleId: targetUser.roleId ? targetUser.roleId.toString() : null,
      isActive: targetUser.isActive,
      updatedAt: targetUser.updatedAt,
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return standardError('INVALID_ID', 'Invalid user ID format', 400);
  }

  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  const allowed =
    authRes.user.isDeveloper ||
    authRes.user.isOwner ||
    can(authRes.user, authRes.role, 'users.manage');

  if (!allowed) {
    return standardError('RBAC_FORBIDDEN', 'Permission denied: users.manage required', 403);
  }

  await connectToDatabase();
  const targetUser = await User.findById(id);
  if (!targetUser) {
    return standardError('USER_NOT_FOUND', 'User not found', 404);
  }

  // Prevent deleting self
  if (authRes.user.userId === targetUser._id.toString()) {
    return standardError('FORBIDDEN', 'Cannot delete or deactivate your own account', 403);
  }

  // Prevent deleting developer or primary owner
  if (targetUser.isDeveloper || targetUser.isOwner) {
    return standardError('FORBIDDEN', 'Platform Developer and Owner accounts cannot be deleted', 403);
  }

  const { searchParams } = new URL(req.url);
  const permanent = searchParams.get('permanent') === 'true';

  if (permanent) {
    await User.findByIdAndDelete(id);

    recordAuditEvent({
      actorUserId: authRes.user.userId,
      actorEmail: authRes.user.email,
      actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: id,
      route: `/api/users/${id}`,
      method: 'DELETE',
      status: 200,
      durationMs: Date.now() - startTime,
      metadata: { targetEmail: targetUser.email, permanent: true },
    });

    return NextResponse.json({ success: true, message: `User account '${targetUser.email}' permanently removed.` });
  }

  // Default: Soft deactivation
  targetUser.isActive = false;
  await targetUser.save();
  invalidateRoleCache(targetUser.roleId?.toString());

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'user.deactivated',
    resourceType: 'user',
    resourceId: id,
    route: `/api/users/${id}`,
    method: 'DELETE',
    status: 200,
    durationMs: Date.now() - startTime,
    metadata: { targetEmail: targetUser.email },
  });

  return NextResponse.json({ success: true, message: `User account '${targetUser.email}' deactivated.` });
}
