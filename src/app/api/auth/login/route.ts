import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { comparePassword, signToken, createAuthCookieHeader } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';
import { standardError } from '@/lib/authGuard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();

  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      recordAuditEvent({
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 400,
        durationMs: Date.now() - startTime,
        userEmail: email || 'unknown',
        error: 'auth.login.failure.missing_fields',
      });
      return standardError('AUTH_MISSING_CREDENTIALS', 'Email and password are required.', 400, {
        email: !email ? 'Email is required' : '',
        password: !password ? 'Password is required' : '',
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      recordAuditEvent({
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 401,
        durationMs: Date.now() - startTime,
        userEmail: email,
        error: 'auth.login.failure.invalid_credentials',
      });
      return standardError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      recordAuditEvent({
        method: 'POST',
        path: '/api/auth/login',
        statusCode: 401,
        durationMs: Date.now() - startTime,
        userEmail: email,
        error: 'auth.login.failure.invalid_credentials',
      });
      return standardError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password.', 401);
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      isDeveloper: user.isDeveloper,
      isOwner: user.isOwner,
      roleId: user.roleId?.toString(),
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user._id.toString(),
      userEmail: user.email,
      error: 'auth.login.success',
    });

    const redirectPath = user.isDeveloper
      ? '/dashboard/developer'
      : user.isOwner
      ? '/dashboard/owner'
      : user.roleId
      ? '/dashboard/properties'
      : '/portal';

    const response = NextResponse.json({
      success: true,
      redirectPath,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isDeveloper: user.isDeveloper,
        isOwner: user.isOwner,
        roleId: user.roleId,
      },
    });

    // Set HttpOnly cookie with proxy anti-cache header
    response.headers.set('Set-Cookie', createAuthCookieHeader(token));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return response;
  } catch (err: any) {
    return standardError('AUTH_SERVER_ERROR', 'An unexpected error occurred during authentication.', 500);
  }
}
