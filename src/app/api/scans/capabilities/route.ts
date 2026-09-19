import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireFeature } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  try {
    const authRes = await requireUser();
    if (authRes.error) return authRes.error;

    const featRes = await requireFeature('ai_property_scanning');
    if (featRes.error) return featRes.error;

    const userAgent = req.headers.get('user-agent') || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    const isMobile = isIOS || isAndroid || /Mobile/.test(userAgent);

    return NextResponse.json({
      success: true,
      data: {
        platform: {
          scanningEnabled: true,
          reconstructionEnabled: true,
          storageProvider: 'supabase_or_local',
          maxChunkSizeBytes: 5 * 1024 * 1024, // 5MB
          maxTotalUploadBytes: 500 * 1024 * 1024, // 500MB
          maxRoomsPerScan: 20,
        },
        clientEnvironment: {
          userAgent,
          isMobile,
          browserFamily: isIOS ? 'ios_safari' : isAndroid ? 'android_chrome' : 'desktop',
          recommendedResolution: isMobile ? { width: 1920, height: 1080 } : { width: 1280, height: 720 },
          targetFps: 30,
        },
        supportedPipelines: ['photogrammetry', 'gaussian_splatting', 'neural_surface_mesh'],
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
