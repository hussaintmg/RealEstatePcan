import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requireDeveloper, standardError, invalidateFeatureCache } from '@/lib/authGuard';
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

const DEFAULT_AI_PROVIDERS = [
  {
    id: 'gemini-primary',
    name: 'Google Gemini 2.0 Flash',
    type: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    modelName: 'gemini-2.0-flash',
    priority: 1,
    isEnabled: true,
  },
];

export async function GET() {
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  if (!authRes.user.isDeveloper && !authRes.user.isOwner) {
    return standardError('AUTH_FORBIDDEN', 'Developer or Owner privileges are required', 403);
  }

  await connectToDatabase();
  let config = await SystemConfig.findOne().lean();

  // If SystemConfig does not exist yet, auto-bootstrap or provide safe fallback
  if (!config) {
    try {
      const { ensureDeveloperBootstrap } = await import('@/lib/developerBootstrap');
      await ensureDeveloperBootstrap();
      config = await SystemConfig.findOne().lean();
    } catch {
      // Continue to direct instantiation
    }
  }

  if (!config) {
    try {
      const newConfig = new SystemConfig({
        singletonKey: 'PRIMARY_SYSTEM_CONFIG',
        setupCompleted: true,
        setupVersion: '1.0.0',
        setupCompletedAt: new Date(),
        developerUserId: authRes.user.userId as any,
        branding: {
          websiteName: 'Aura Heights Luxury Estates',
          headerLogo: '',
          footerLogo: '',
          favicon: '/favicon.ico',
          headerLogoLight: '',
          headerLogoDark: '',
          footerLogoLight: '',
          footerLogoDark: '',
        },
        features: getNormalizedFeatures(),
        storageProvider: 'supabase',
        supabaseConfig: {
          url: process.env.SUPABASE_URL || '',
          anonKey: process.env.SUPABASE_ANON_KEY || '',
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          bucket: 'real-estate-assets',
        },
        aiProviders: DEFAULT_AI_PROVIDERS,
      });
      await newConfig.save();
      config = newConfig.toObject();
    } catch {
      // In case of singleton collision or read-only database, attempt to re-query
      config = await SystemConfig.findOne().lean();
      if (!config) {
        // Safe in-memory fallback so developer console NEVER crashes or fails to load
        config = {
          setupCompleted: true,
          setupVersion: '1.0.0',
          branding: {
            websiteName: 'Aura Heights Luxury Estates',
            headerLogo: '',
            footerLogo: '',
            favicon: '/favicon.ico',
          },
          features: getNormalizedFeatures(),
          storageProvider: 'supabase',
          aiProviders: DEFAULT_AI_PROVIDERS,
        } as any;
      }
    }
  }

  // Enrich with feature registry metadata
  const featuresNormalized = getNormalizedFeatures(config?.features as any);
  const aiProviders = Array.isArray(config?.aiProviders) && config.aiProviders.length > 0
    ? config.aiProviders
    : DEFAULT_AI_PROVIDERS;

  return NextResponse.json({
    success: true,
    config: {
      ...config,
      features: featuresNormalized,
      aiProviders,
    },
    featureCatalog: FEATURE_REGISTRY,
  });
}

export async function PUT(req: NextRequest) {
  const startTime = Date.now();
  const authRes = await requireUser();
  if (authRes.error) return authRes.error;

  if (!authRes.user.isDeveloper && !authRes.user.isOwner) {
    return standardError('AUTH_FORBIDDEN', 'Developer or Owner privileges are required', 403);
  }
  const user = authRes.user;

  await connectToDatabase();
  const body = await req.json();

  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig({
        singletonKey: 'PRIMARY_SYSTEM_CONFIG',
        setupCompleted: true,
        setupVersion: '1.0.0',
        setupCompletedAt: new Date(),
        developerUserId: user.userId as any,
        branding: {
          websiteName: 'Aura Heights Luxury Estates',
          headerLogo: '',
          footerLogo: '',
          favicon: '/favicon.ico',
        },
        features: getNormalizedFeatures(),
        storageProvider: 'supabase',
        aiProviders: DEFAULT_AI_PROVIDERS,
      });
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
    invalidateFeatureCache();

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
