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

export async function GET(req: NextRequest) {
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
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('roleId') || '';
  const statusFilter = searchParams.get('status') || '';

  const query: Record<string, any> = {};

  if (search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
  }

  if (roleFilter && mongoose.Types.ObjectId.isValid(roleFilter)) {
    query.roleId = new mongoose.Types.ObjectId(roleFilter);
  }

  if (statusFilter === 'active') {
    query.isActive = true;
  } else if (statusFilter === 'inactive') {
    query.isActive = false;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .populate('roleId', 'name description status version')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  const sanitizedUsers = users.map((u: any) => ({
    id: u._id.toString(),
    _id: u._id.toString(),
    fullName: u.fullName,
    email: u.email,
    phone: u.phone || '',
    companyName: u.companyName || '',
    isDeveloper: !!u.isDeveloper,
    isOwner: !!u.isOwner,
    roleId: u.roleId?._id ? u.roleId._id.toString() : u.roleId ? u.roleId.toString() : null,
    role: u.roleId && typeof u.roleId === 'object' ? u.roleId : null,
    isActive: u.isActive !== false,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));

  return NextResponse.json({
    success: true,
    users: sanitizedUsers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
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
  const body = await req.json();

  if (!body.fullName || typeof body.fullName !== 'string' || !body.fullName.trim()) {
    return standardError('VALIDATION_ERROR', 'Full name is required', 422, { fullName: 'Name is required' });
  }

  if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
    return standardError('VALIDATION_ERROR', 'Valid email address is required', 422, { email: 'Invalid email' });
  }

  if (!body.password || typeof body.password !== 'string' || body.password.length < 8) {
    return standardError('VALIDATION_ERROR', 'Password must be at least 8 characters long', 422, {
      password: 'Password must be at least 8 characters',
    });
  }

  const normalizedEmail = body.email.trim().toLowerCase();

  // Check unique email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return standardError('USER_EXISTS', `An account with email '${normalizedEmail}' already exists`, 409);
  }

  // Validate roleId if assigned
  let assignedRoleId: mongoose.Types.ObjectId | undefined = undefined;
  if (body.roleId) {
    if (!mongoose.Types.ObjectId.isValid(body.roleId)) {
      return standardError('INVALID_ROLE_ID', 'Invalid role ID provided', 422);
    }
    const role = await Role.findById(body.roleId);
    if (!role) {
      return standardError('ROLE_NOT_FOUND', 'Specified role does not exist', 404);
    }
    if (role.status === 'archived') {
      return standardError('ROLE_ARCHIVED', 'Cannot assign an archived role to active staff', 422);
    }
    assignedRoleId = role._id as mongoose.Types.ObjectId;
  }

  try {
    const passwordHash = await hashPassword(body.password);
    const newUser = await User.create({
      fullName: body.fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      phone: body.phone?.trim() || '',
      companyName: body.companyName?.trim() || '',
      isDeveloper: false,
      isOwner: false,
      roleId: assignedRoleId,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId(authRes.user.userId),
    });

    invalidateRoleCache(assignedRoleId?.toString());

    const safeUser = {
      id: newUser._id.toString(),
      _id: newUser._id.toString(),
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      companyName: newUser.companyName,
      isDeveloper: false,
      isOwner: false,
      roleId: assignedRoleId ? assignedRoleId.toString() : null,
      isActive: true,
      createdAt: newUser.createdAt,
    };

    recordAuditEvent({
      actorUserId: authRes.user.userId,
      actorEmail: authRes.user.email,
      actorRole: authRes.user.isDeveloper ? 'developer' : authRes.user.isOwner ? 'owner' : 'staff',
      action: 'user.created',
      resourceType: 'user',
      resourceId: newUser._id.toString(),
      route: '/api/users',
      method: 'POST',
      status: 201,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(undefined, safeUser),
      metadata: { createdUserEmail: newUser.email, assignedRole: assignedRoleId?.toString() },
    });

    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (err: any) {
    return standardError('USER_CREATE_FAILED', err.message || 'Failed to create user', 500);
  }
}
