import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    await connectToDatabase();
    const config = await SystemConfig.findOne().lean();

    if (url.startsWith('/uploads/')) {
      // Local file
      const fileName = url.replace('/uploads/', '');
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      try {
        await fs.unlink(filePath);
      } catch {
        // file may already be removed
      }
      return NextResponse.json({ success: true, message: 'Local file deleted' });
    }

    // Supabase file
    const supabaseUrl = config?.supabaseConfig?.url || process.env.SUPABASE_URL;
    const serviceKey = config?.supabaseConfig?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = config?.supabaseConfig?.bucket || 'real-estate-assets';

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey);
      // Extract path after bucket name in URL
      const match = url.split(`/${bucket}/`)[1];
      if (match) {
        await supabase.storage.from(bucket).remove([match]);
      }
    }

    return NextResponse.json({ success: true, message: 'File deleted' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
