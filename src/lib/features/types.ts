export type FeatureCategory = 'platform' | 'operations' | 'experience' | 'integrations';

export type FeatureScope = 'platform' | 'workspace';

export interface FeatureDefinition {
  key: string;
  label: string;
  description: string;
  category: FeatureCategory;
  defaultEnabled: boolean;
  scope: FeatureScope;
  dependencies?: string[];
  dangerous?: boolean;
}
