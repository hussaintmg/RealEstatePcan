import { FEATURE_MAP, getFeature } from './registry';

export * from './registry';
export * from './types';

/**
 * Checks whether a feature is enabled by key.
 * If an optional workspace/user features record is provided, it checks that;
 * otherwise it falls back to the feature's defaultEnabled setting in the registry.
 */
export function isFeatureEnabled(
  featureKey: string,
  overrides?: Record<string, boolean>
): boolean {
  if (overrides && typeof overrides[featureKey] === 'boolean') {
    return overrides[featureKey];
  }
  const feature = getFeature(featureKey);
  if (!feature) {
    // If not in registry, default to enabled for backwards compatibility
    return true;
  }
  return feature.defaultEnabled ?? true;
}
