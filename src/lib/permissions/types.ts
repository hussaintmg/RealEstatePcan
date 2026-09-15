export type DataScope = 'own' | 'assigned' | 'team' | 'all';

export type PermissionType = 'read' | 'write' | 'action' | 'admin';

export type ModuleName =
  | 'properties'
  | 'leads'
  | 'customers'
  | 'deals'
  | 'invoices'
  | 'cms'
  | 'templates'
  | 'users'
  | 'roles'
  | 'audit'
  | 'system';

export interface PermissionDefinition {
  key: string;
  module: ModuleName;
  label: string;
  description: string;
  type: PermissionType;
  supportedScopes?: DataScope[];
  defaultScope?: DataScope;
  requiresFeature?: string;
  dangerous?: boolean;
  dependencies?: string[];
}

export interface RolePermissionAssignment {
  key: string;
  enabled: boolean;
  scope?: DataScope;
}
