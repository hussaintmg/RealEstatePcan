import { NextRequest, NextResponse } from 'next/server';
import { executeFormAction, checkRateLimit } from '@/lib/cms/formActions';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';

    // 1. Rate Limiting Check (10 submissions per minute per IP)
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many submissions. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { actionType, formData, propertyId, pageSlug } = body;

    // 2. Anti-spam honeypot detection
    if (formData?.website_url_trap) {
      // Silent rejection of automated bot traps
      return NextResponse.json({ success: true, message: 'Inquiry received' });
    }

    if (!actionType) {
      return NextResponse.json({ success: false, error: 'Missing actionType' }, { status: 400 });
    }

    // 3. Dispatch to Server Form Action Pipeline
    const result = await executeFormAction(actionType, formData || {}, {
      ip,
      userAgent: req.headers.get('user-agent') || '',
      propertyId,
      pageSlug,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Form submission error:', err);
    return NextResponse.json(
      { success: false, error: 'An unexpected system error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
