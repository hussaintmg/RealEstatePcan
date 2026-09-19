import { FeatureDefinition, FeatureCategory } from './types';

export * from './types';

export const FEATURE_REGISTRY: FeatureDefinition[] = [
  {
    key: 'globalSearch',
    label: 'Global Omnisearch',
    description: 'Universal instant search across properties, leads, customer profiles, and documents.',
    category: 'platform',
    defaultEnabled: true,
    scope: 'platform',
  },
  {
    key: 'aiAssistant',
    label: 'AI Real Estate Assistant',
    description: 'Generative assistant capable of answering client queries and analyzing leads.',
    category: 'operations',
    defaultEnabled: true,
    scope: 'platform',
  },
  {
    key: 'customerPortal',
    label: 'Client Self-Service Portal',
    description: 'Dedicated client interface for unit owners to track milestones, invoices, and handovers.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'playcanvas3d',
    label: 'PlayCanvas 3D Studio',
    description: 'Interactive WebGL 3D architectural viewer, floorplans, and spatial walkthroughs.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'scrollVideoFrames',
    label: 'Cinematic Scroll Video Engine',
    description: 'High-performance interactive video frame rendering synchronized to user scroll depth.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'cms',
    label: 'Custom CMS Studio',
    description: 'Visual website page designer, layout composition engine, and dynamic block manager.',
    category: 'platform',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'custom_section_studio',
    label: 'Custom Section Studio',
    description: 'Declarative studio allowing Owners to build, preview, and register custom website sections.',
    category: 'platform',
    defaultEnabled: true,
    scope: 'workspace',
    dependencies: ['cms'],
  },
  {
    key: 'templateEditors',
    label: 'Omnichannel Template Suite',
    description: 'Designer for automated notification templates across email, SMS, and WhatsApp.',
    category: 'operations',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'themeToggle',
    label: 'Dynamic Dark / Light Theme Engine',
    description: 'Custom palette selector and automatic client theme mode switching.',
    category: 'platform',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'realtimeAuditLogs',
    label: 'Live Security Audit Stream',
    description: 'Tamper-evident real-time telemetry, mutation diffs, and security audit log feed.',
    category: 'platform',
    defaultEnabled: true,
    scope: 'platform',
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Business Integration',
    description: 'Direct messaging gateway to dispatch brochures, alerts, and invoice payment links.',
    category: 'integrations',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'payments',
    label: 'Online Payment Gateway',
    description: 'Integrated credit card and wire transfer processing for milestone payments.',
    category: 'integrations',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'ai_property_scanning',
    label: 'AI Property Scanning Engine',
    description: 'Browser-native mobile camera capture, guided quality analysis, and multi-room scanning.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
  },
  {
    key: 'scan_3d_reconstruction',
    label: 'Spatial 3D Reconstruction Pipeline',
    description: 'Asynchronous photogrammetric and neural 3D mesh and splat reconstruction.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
    dependencies: ['ai_property_scanning'],
  },
  {
    key: 'scan_floor_plans',
    label: 'AI 2D Floor Plan Synthesizer',
    description: 'Automated 2D architectural vector floor plan extraction, SVG export, and vector editor.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
    dependencies: ['ai_property_scanning'],
  },
  {
    key: 'scan_measurements',
    label: 'Spatial 3D Measurement Engine',
    description: 'Real-world calibrated 3D point-to-point and area dimensioning.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
    dependencies: ['ai_property_scanning'],
  },
  {
    key: 'scan_public_viewer',
    label: 'Public Interactive 3D Walkthrough Viewer',
    description: 'Secure, authenticated shareable 3D viewer links for buyers and prospects.',
    category: 'experience',
    defaultEnabled: true,
    scope: 'workspace',
    dependencies: ['ai_property_scanning'],
  },
];

export const FEATURE_MAP = new Map<string, FeatureDefinition>(
  FEATURE_REGISTRY.map((f) => [f.key, f])
);

export const FEATURE_CATEGORIES: { key: FeatureCategory; label: string }[] = [
  { key: 'platform', label: 'Platform & Security' },
  { key: 'operations', label: 'Operations & CRM' },
  { key: 'experience', label: 'Client Experience & 3D' },
  { key: 'integrations', label: 'Channels & Gateways' },
];

export function getAllFeatures(): FeatureDefinition[] {
  return [...FEATURE_REGISTRY];
}

export function getFeature(key: string): FeatureDefinition | undefined {
  return FEATURE_MAP.get(key);
}

export function isValidFeature(key: string): boolean {
  return FEATURE_MAP.has(key);
}

/**
 * Validates dependencies between feature flags.
 * E.g., if feature X requires feature Y, returns any unmet dependencies.
 */
export function validateFeatureDependencies(
  features: Record<string, boolean>
): { valid: boolean; unmet: { feature: string; missingDependency: string }[] } {
  const unmet: { feature: string; missingDependency: string }[] = [];

  for (const [key, isEnabled] of Object.entries(features)) {
    if (isEnabled) {
      const def = getFeature(key);
      if (def?.dependencies) {
        for (const dep of def.dependencies) {
          if (!features[dep]) {
            unmet.push({ feature: key, missingDependency: dep });
          }
        }
      }
    }
  }

  return {
    valid: unmet.length === 0,
    unmet,
  };
}

/**
 * Merges raw features with defaults for all registered features.
 */
export function getNormalizedFeatures(
  existingFeatures?: Record<string, boolean>
): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  for (const feat of FEATURE_REGISTRY) {
    if (existingFeatures && typeof existingFeatures[feat.key] === 'boolean') {
      normalized[feat.key] = existingFeatures[feat.key];
    } else {
      normalized[feat.key] = feat.defaultEnabled;
    }
  }
  return normalized;
}
