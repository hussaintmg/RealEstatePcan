import { NextResponse } from 'next/server';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  await connectToDatabase();
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const config = await SystemConfig.findOne().lean();
  const storageProvider = config?.storageProvider || 'supabase';
  const url = config?.supabaseConfig?.url || process.env.SUPABASE_URL || '';
  const anonKey = config?.supabaseConfig?.anonKey || process.env.SUPABASE_ANON_KEY || '';
  const bucket = config?.supabaseConfig?.bucket || 'real-estate-assets';

  return NextResponse.json({
    success: true,
    storageProvider,
    isConfigured: !!(url && anonKey),
    supabase: {
      url,
      anonKey,
      bucket,
    },
  });
}
