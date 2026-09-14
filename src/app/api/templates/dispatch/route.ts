import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { dispatchTemplate } from '@/lib/templates/dispatchService';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const featureCheck = await verifyFeatureAllowed('templateEditors');
  if (featureCheck) return featureCheck;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { templateId, recipientEmail, recipientPhone, dataContext = {} } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    const result = await dispatchTemplate({
      templateId,
      recipientEmail,
      recipientPhone,
      dataContext,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/templates/dispatch',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user.userId,
      userEmail: user.email,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
