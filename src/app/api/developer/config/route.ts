import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent } from '@/lib/auditLogger';
import { ensureDeveloperBootstrap } from '@/lib/developerBootstrap';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  await ensureDeveloperBootstrap();

  const user = await getSessionUser();
  const config = await SystemConfig.findOne().lean();

  if (!config) {
    return NextResponse.json({ error: 'SystemConfig not initialized' }, { status: 500 });
  }

  // If not developer, return only public feature flags
  if (!user || !user.isDeveloper) {
    return NextResponse.json({
      success: true,
      features: config.features,
      storageProvider: config.storageProvider,
    });
  }

  return NextResponse.json({
    success: true,
    config,
  });
}

export async function PUT(req: NextRequest) {
  const startTime = Date.now();
  const user = await getSessionUser();

  if (!user || !user.isDeveloper) {
    return NextResponse.json(
      { error: 'Forbidden: Only Master Developer can alter Developer Settings' },
      { status: 403 }
    );
  }

  await connectToDatabase();
  const body = await req.json();

  try {
    const config = await SystemConfig.findOne();
    if (!config) {
      return NextResponse.json({ error: 'Config not found' }, { status: 404 });
    }

    if (body.features) config.features = { ...config.features, ...body.features };
    if (body.storageProvider) config.storageProvider = body.storageProvider;
    if (body.supabaseConfig) config.supabaseConfig = { ...config.supabaseConfig, ...body.supabaseConfig };
    if (body.aiProviders) config.aiProviders = body.aiProviders;
    config.updatedBy = user.userId as any;

    await config.save();

    recordAuditEvent({
      method: 'PUT',
      path: '/api/developer/config',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
