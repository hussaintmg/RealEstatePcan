import { NextRequest, NextResponse } from 'next/server';
import { requireDeveloper, standardError } from '@/lib/authGuard';
import { SystemConfig } from '@/models/SystemConfig';
import { connectToDatabase } from '@/lib/db';
import { recordAuditEvent, computeSafeDiff } from '@/lib/auditLogger';
import {
  FEATURE_REGISTRY,
  isValidFeature,
  validateFeatureDependencies,
  getNormalizedFeatures,
} from '@/lib/features/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authRes = await requireDeveloper();
  if (authRes.error) return authRes.error;

  await connectToDatabase();
  const config = await SystemConfig.findOne().lean();

  if (!config) {
    return standardError('CONFIG_NOT_FOUND', 'SystemConfig not initialized', 500);
  }

  // Enrich with feature registry metadata
  const featuresNormalized = getNormalizedFeatures(config.features as any);

  return NextResponse.json({
    success: true,
    config: {
      ...config,
      features: featuresNormalized,
    },
    featureCatalog: FEATURE_REGISTRY,
  });
}

export async function PUT(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireDeveloper();
  if (authRes.error) return authRes.error;
  const user = authRes.user;

  await connectToDatabase();
  const body = await req.json();

  try {
    const config = await SystemConfig.findOne();
    if (!config) {
      return standardError('CONFIG_NOT_FOUND', 'SystemConfig document not found', 404);
    }

    const beforeSnapshot = {
      features: config.features ? JSON.parse(JSON.stringify(config.features)) : {},
      branding: config.branding ? JSON.parse(JSON.stringify(config.branding)) : {},
      storageProvider: config.storageProvider,
    };

    // Validate feature keys if features are being updated
    if (body.features && typeof body.features === 'object') {
      for (const key of Object.keys(body.features)) {
        if (!isValidFeature(key)) {
          return standardError(
            'INVALID_FEATURE_KEY',
            `Unknown feature key: '${key}'. Features must be declared in the central Feature Registry.`,
            422
          );
        }
      }

      const mergedFeatures = { ...(config.features as any), ...body.features };
      const depValidation = validateFeatureDependencies(mergedFeatures);
      if (!depValidation.valid) {
        const errorMsg = depValidation.unmet
          .map((u) => `Feature '${u.feature}' requires '${u.missingDependency}' to be enabled.`)
          .join(' ');
        return standardError('FEATURE_DEPENDENCY_ERROR', errorMsg, 422);
      }

      config.features = mergedFeatures;
    }

    if (body.branding) config.branding = { ...config.branding, ...body.branding };
    if (body.storageProvider) config.storageProvider = body.storageProvider;
    if (body.supabaseConfig) config.supabaseConfig = { ...config.supabaseConfig, ...body.supabaseConfig };
    if (body.aiProviders) config.aiProviders = body.aiProviders;
    config.updatedBy = user.userId as any;

    await config.save();

    const afterSnapshot = {
      features: config.features ? JSON.parse(JSON.stringify(config.features)) : {},
      branding: config.branding ? JSON.parse(JSON.stringify(config.branding)) : {},
      storageProvider: config.storageProvider,
    };

    // Determine specific action name for clarity
    const isFeatureOnlyUpdate = body.features && !body.branding && !body.aiProviders && !body.supabaseConfig;
    const actionName = isFeatureOnlyUpdate ? 'feature_flags.updated' : 'system_config.updated';

    recordAuditEvent({
      actorUserId: user.userId,
      actorEmail: user.email,
      actorRole: 'developer',
      action: actionName,
      resourceType: 'system_config',
      resourceId: config._id.toString(),
      route: '/api/developer/config',
      method: 'PUT',
      status: 200,
      durationMs: Date.now() - startTime,
      changes: computeSafeDiff(beforeSnapshot, afterSnapshot),
      metadata: {
        updatedFields: Object.keys(body),
        featureKeysUpdated: body.features ? Object.keys(body.features) : [],
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return standardError('CONFIG_UPDATE_FAILED', err.message || 'Failed to update system config', 500);
  }
}
