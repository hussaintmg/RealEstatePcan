import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/models/User';
import { hashPassword, signToken, createAuthCookieHeader } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  await connectToDatabase();

  try {
    let role = 'developer';
    try {
      const body = await req.json();
      if (body?.role) role = body.role;
    } catch {
      // Default to developer
    }

    let user;
    const devEmail = 'developer@auraheights.com';
    const ownerEmail = 'owner@auraheights.com';

    if (role === 'owner') {
      user = await User.findOne({ email: ownerEmail });
      if (!user) {
        user = await User.findOne({ isOwner: true });
      }

      if (!user) {
        const passwordHash = await hashPassword('OwnerPassword2026!');
        user = await User.create({
          fullName: 'Evelyn Sinclair (Owner)',
          email: ownerEmail,
          passwordHash,
          isDeveloper: false,
          isOwner: true,
          isActive: true,
          companyName: 'Aura Heights Luxury Living Ltd.',
        });
      } else {
        // Ensure user is active
        if (!user.isActive) {
          user.isActive = true;
          await user.save();
        }
      }
    } else {
      // Default: Developer Admin
      user = await User.findOne({ email: devEmail });
      if (!user) {
        user = await User.findOne({ isDeveloper: true });
      }

      if (!user) {
        const passwordHash = await hashPassword('DeveloperPassword123!');
        user = await User.create({
          fullName: 'Platform Developer (Admin)',
          email: devEmail,
          passwordHash,
          isDeveloper: true,
          isOwner: false,
          isActive: true,
          companyName: 'Aura Heights Technology',
        });
      } else {
        // Ensure user is active and has developer flag
        if (!user.isActive || !user.isDeveloper) {
          user.isActive = true;
          user.isDeveloper = true;
          await user.save();
        }
      }
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
      path: '/api/auth/demo',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user._id.toString(),
      userEmail: user.email,
      error: 'auth.demo_login.success',
    });

    const redirectPath = '/dashboard/properties';

    const response = NextResponse.json({
      success: true,
      message: `Authenticated as ${user.isDeveloper ? 'Developer Admin' : 'Business Owner'}`,
      redirectPath,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isDeveloper: user.isDeveloper,
        isOwner: user.isOwner,
      },
    });

    response.headers.set('Set-Cookie', createAuthCookieHeader(token));
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return response;
  } catch (err: any) {
    console.error('Demo auth error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Demo authentication failed' },
      { status: 500 }
    );
  }
}
