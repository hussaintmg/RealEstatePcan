import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { requireDeveloper, standardError } from '@/lib/authGuard';
import { User } from '@/models/User';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireDeveloper();
  if (authRes.error) return authRes.error;
  const session = authRes.user;

  await connectToDatabase();
  const body = await req.json();
  const fullName = body.fullName?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  const phone = body.phone?.trim() || '';

  if (!fullName || !email || !password) {
    return standardError('VALIDATION_ERROR', 'Full name, email, and password are required.', 400, {
      fullName: !fullName ? 'Full name is required' : '',
      email: !email ? 'Email is required' : '',
      password: !password ? 'Password is required' : '',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return standardError('VALIDATION_ERROR', 'Invalid email address format.', 400, {
      email: 'Please provide a valid email address',
    });
  }

  if (password.length < 8) {
    return standardError('VALIDATION_ERROR', 'Password must be at least 8 characters long.', 400, {
      password: 'Password must be at least 8 characters long',
    });
  }

  try {
    const existingOwner = await User.findOne({ isOwner: true });
    if (existingOwner) {
      return standardError(
        'OWNER_ALREADY_EXISTS',
        'A primary Owner account already exists. Only one primary Owner is permitted.',
        409
      );
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return standardError('EMAIL_IN_USE', 'A user with this email already exists.', 400);
    }

    const passwordHash = await hashPassword(password);
    const owner = await User.create({
      fullName,
      email,
      passwordHash,
      phone,
      isDeveloper: false,
      isOwner: true,
      isActive: true,
      createdBy: session.userId as any,
    });

    // Update SystemConfig owner association
    await SystemConfig.findOneAndUpdate(
      {},
      { $set: { ownerUserId: owner._id } }
    );

    recordAuditEvent({
      method: 'POST',
      path: '/api/developer/provision-owner',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: session.userId,
      userEmail: session.email,
      error: 'owner.created',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Owner account successfully created',
        owner: {
          id: owner._id,
          fullName: owner.fullName,
          email: owner.email,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return standardError('PROVISION_ERROR', err.message || 'Failed to provision Owner account', 500);
  }
}
