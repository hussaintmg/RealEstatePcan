import { NextRequest, NextResponse } from 'next/server';
import { verifyFeatureAllowed } from '@/middleware/featureGating';
import { executeAiWithFailover } from '@/lib/ai/AiFailoverService';
import { getSessionUser } from '@/lib/auth';
import { recordAuditEvent } from '@/lib/auditLogger';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Check if AI is allowed by Developer Settings
  const featureCheck = await verifyFeatureAllowed('aiAssistant');
  if (featureCheck) return featureCheck;

  const user = await getSessionUser();

  try {
    const body = await req.json();
    const { prompt, sessionId = 'default-guest-session', systemInstruction } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt is required.' }, { status: 400 });
    }

    const realEstateContext =
      systemInstruction ||
      'You are the intelligent Real Estate AI assistant for our premium properties platform. Help clients explore listings, understand mortgage calculations, schedule 3D PlayCanvas virtual walkthroughs, and answer real estate queries professionally.';

    const result = await executeAiWithFailover({
      sessionId,
      userId: user?.userId,
      prompt,
      systemInstruction: realEstateContext,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/ai/chat',
      statusCode: 200,
      durationMs: Date.now() - startTime,
      userId: user?.userId,
      userEmail: user?.email,
    });

    return NextResponse.json({
      success: true,
      text: result.text,
      providerUsed: result.providerUsed,
      failoverLogs: result.failoverLogs,
    });
  } catch (err: any) {
    recordAuditEvent({
      method: 'POST',
      path: '/api/ai/chat',
      statusCode: 500,
      durationMs: Date.now() - startTime,
      userId: user?.userId,
      userEmail: user?.email,
      error: err.message,
    });

    return NextResponse.json(
      {
        success: false,
        error: err.message || 'AI generation failed across all fallback providers.',
      },
      { status: 500 }
    );
  }
}
