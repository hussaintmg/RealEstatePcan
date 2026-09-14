import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { comparePassword, signToken, createAuthCookieHeader } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { ensureDeveloperBootstrap } from '@/lib/developerBootstrap';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();
  await ensureDeveloperBootstrap();

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
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
    });

    const response = NextResponse.json({
      success: true,
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
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
