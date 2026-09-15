import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById(session.userId).select('-passwordHash').lean();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let role = null;
  if (user.roleId) {
    role = await Role.findById(user.roleId).lean();
  }

  const res = NextResponse.json({
    authenticated: true,
    user: {
      ...user,
      role,
    },
  });
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  return res;
}
