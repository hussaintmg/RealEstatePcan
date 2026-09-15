import { NextRequest, NextResponse } from 'next/server';
import { initializeSetup } from '@/lib/setupService';
import { standardError } from '@/lib/authGuard';
import { markSetupCompleted } from '@/lib/proxy';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const result = await initializeSetup(payload);

    // Mark proxy cache as completed instantly
    markSetupCompleted();

    const response = NextResponse.json(result, { status: 201 });

    // Set a lightweight setup completion cookie for instant client & edge acknowledgement
    response.headers.append(
      'Set-Cookie',
      'platform_setup_status=completed; Path=/; SameSite=Lax; Max-Age=31536000'
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    return response;
  } catch (err: any) {
    const msg: string = err.message || 'Setup failed';

    if (msg.startsWith('SETUP_ALREADY_COMPLETED')) {
      return standardError('SETUP_ALREADY_COMPLETED', 'Setup has already been completed on this platform.', 409);
    }
    if (msg.startsWith('DEVELOPER_ALREADY_EXISTS')) {
      return standardError('DEVELOPER_ALREADY_EXISTS', 'A Developer account already exists.', 409);
    }
    if (msg.startsWith('OWNER_ALREADY_EXISTS')) {
      return standardError('OWNER_ALREADY_EXISTS', 'A primary Owner account already exists. Only one is permitted.', 409);
    }
    if (msg.startsWith('EMAIL_IN_USE')) {
      return standardError('EMAIL_IN_USE', 'The provided email is already registered.', 400);
    }
    if (msg.startsWith('VALIDATION_ERROR')) {
      return standardError('VALIDATION_ERROR', msg.replace('VALIDATION_ERROR: ', ''), 400);
    }

    return standardError('SETUP_INITIALIZATION_ERROR', 'Internal server error during setup initialization', 500);
  }
}
