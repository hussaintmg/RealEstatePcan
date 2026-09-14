import { NextResponse } from 'next/server';
import { SystemConfig, ISystemFeatures } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';

export async function verifyFeatureAllowed(featureKey: keyof ISystemFeatures): Promise<NextResponse | null> {
  await connectToDatabase();
  const config = await SystemConfig.findOne().lean();
  
  if (!config) {
    // If no config exists yet, allow by default
    return null;
  }

  const isAllowed = config.features[featureKey];
  if (!isAllowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Feature '${featureKey}' is currently disabled by Developer Settings.`,
        code: 'FEATURE_DISABLED',
      },
      { status: 403 }
    );
  }

  return null;
}
