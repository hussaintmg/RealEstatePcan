import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hashPassword } from '@/lib/auth';
import { User } from '@/models/User';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const session = await getSessionUser();

  if (!session || !session.isDeveloper) {
    return NextResponse.json({ error: 'Forbidden. Developer access required.' }, { status: 403 });
  }

  await connectToDatabase();
  const { fullName, email, password, phone } = await req.json();

  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const owner = await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || '',
      isDeveloper: false,
      isOwner: true,
      isActive: true,
      createdBy: session.userId,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/developer/provision-owner',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: session.userId,
      userEmail: session.email,
    });

    return NextResponse.json({
      success: true,
      message: 'Owner account successfully created',
      owner: {
        id: owner._id,
        fullName: owner.fullName,
        email: owner.email,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
