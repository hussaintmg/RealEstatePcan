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

  return NextResponse.json({
    success: true,
    storageProvider,
    supabase: {
      url: config?.supabaseConfig?.url || process.env.SUPABASE_URL || '',
      anonKey: config?.supabaseConfig?.anonKey || process.env.SUPABASE_ANON_KEY || '',
      bucket: config?.supabaseConfig?.bucket || 'real-estate-assets',
    },
  });
}
