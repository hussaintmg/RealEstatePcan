import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireUser, standardError } from '@/lib/authGuard';
import { Role } from '@/models/Role';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import { can } from '@/lib/rbac';
import { validateAndNormalizeAssignments } from '@/lib/permissions/registry';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  const role = await Role.findById(id).lean();
  if (!role) {
    return standardError('ROLE_NOT_FOUND', 'Role not found', 404);
  }

  const userCount = await User.countDocuments({ roleId: role._id });
  return NextResponse.json({ success: true, role: { ...role, userCount } });
}

export async function PUT(
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
  const existingRole = await Role.findById(id);
  if (!existingRole) {
    return standardError('ROLE_NOT_FOUND', 'Role not found', 404);
  }

  const body = await req.json();

  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim().length === 0)) {
    return standardError('VALIDATION_ERROR', 'Role name cannot be empty', 422);
  }

  const beforeSnapshot = {
    name: existingRole.name,
    description: existingRole.description,
    status: existingRole.status,
    dataScope: existingRole.dataScope,
    capabilities: existingRole.capabilities,
  };

  if (body.name) existingRole.name = body.name.trim();
  if (body.description !== undefined) existingRole.description = body.description;
  if (body.status) existingRole.status = body.status;
  if (body.dataScope) existingRole.dataScope = body.dataScope;

  if (Array.isArray(body.capabilities)) {
    const validation = validateAndNormalizeAssignments(body.capabilities);
    if (validation.errors.length > 0) {
      return standardError('VALIDATION_ERROR', validation.errors.join(', '), 422);
    }
    existingRole.capabilities = validation.normalized;
  }

  if (Array.isArray(body.permissions)) {
    existingRole.permissions = body.permissions;
  }

  existingRole.version = (existingRole.version || 1) + 1;
  await existingRole.save();

  const afterSnapshot = {
    name: existingRole.name,
    description: existingRole.description,
    status: existingRole.status,
    dataScope: existingRole.dataScope,
    capabilities: existingRole.capabilities,
  };

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'role.updated',
    resourceType: 'role',
    resourceId: existingRole._id.toString(),
    route: `/api/roles/${id}`,
    method: 'PUT',
    status: 200,
    durationMs: Date.now() - startTime,
    changes: computeSafeDiff(beforeSnapshot, afterSnapshot),
    metadata: { roleName: existingRole.name, version: existingRole.version },
  });

  return NextResponse.json({ success: true, role: existingRole });
}

export async function DELETE(
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
  const role = await Role.findById(id);
  if (!role) {
    return standardError('ROLE_NOT_FOUND', 'Role not found', 404);
  }

  if (role.isSystem) {
    return standardError('FORBIDDEN', 'System built-in roles cannot be deleted', 403);
  }

  const userCount = await User.countDocuments({ roleId: role._id, isActive: true });
  if (userCount > 0) {
    return standardError(
      'ROLE_IN_USE',
      `Cannot delete role '${role.name}': ${userCount} active staff user(s) are currently assigned. Please reassign them before deleting, or archive the role instead.`,
      409
    );
  }

  const { searchParams } = new URL(req.url);
  const archiveOnly = searchParams.get('archive') === 'true';

  if (archiveOnly) {
    role.status = 'archived';
    await role.save();

    recordAuditEvent({
      actorUserId: authRes.user.userId,
      actorEmail: authRes.user.email,
      actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
      action: 'role.archived',
      resourceType: 'role',
      resourceId: role._id.toString(),
      route: `/api/roles/${id}`,
      method: 'DELETE',
      status: 200,
      durationMs: Date.now() - startTime,
      metadata: { roleName: role.name },
    });

    return NextResponse.json({ success: true, message: `Role '${role.name}' has been archived.` });
  }

  await Role.findByIdAndDelete(id);

  recordAuditEvent({
    actorUserId: authRes.user.userId,
    actorEmail: authRes.user.email,
    actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
    action: 'role.deleted',
    resourceType: 'role',
    resourceId: id,
    route: `/api/roles/${id}`,
    method: 'DELETE',
    status: 200,
    durationMs: Date.now() - startTime,
    metadata: { roleName: role.name },
  });

  return NextResponse.json({ success: true, message: `Role '${role.name}' permanently removed.` });
}
