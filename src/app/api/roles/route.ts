import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { Role } from '@/models/Role';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user || (!user.isOwner && !user.isDeveloper)) {
    return NextResponse.json({ error: 'Unauthorized. Owner or Developer only.' }, { status: 403 });
  }

  await connectToDatabase();
  const roles = await Role.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, roles });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const user = await getSessionUser();
  if (!user || (!user.isOwner && !user.isDeveloper)) {
    return NextResponse.json({ error: 'Unauthorized. Owner or Developer only.' }, { status: 403 });
  }

  await connectToDatabase();
  const body = await req.json();

  try {
    const role = await Role.create({
      name: body.name,
      description: body.description || '',
      dataScope: body.dataScope || 'own_data',
      allowedRoleIds: body.allowedRoleIds || [],
      allowedUserIds: body.allowedUserIds || [],
      permissions: body.permissions || [],
      createdBy: user.userId,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/roles',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true, role }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
