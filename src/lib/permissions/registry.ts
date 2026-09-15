import { PermissionDefinition, ModuleName, RolePermissionAssignment, DataScope } from './types';
import { propertyPermissions } from './modules/properties';
import { leadPermissions } from './modules/leads';
import { customerPermissions } from './modules/customers';
import { dealPermissions } from './modules/deals';
import { invoicePermissions } from './modules/invoices';
import { cmsPermissions } from './modules/cms';
import { templatePermissions } from './modules/templates';
import { systemPermissions } from './modules/system';

export * from './types';

export const PERMISSION_REGISTRY: PermissionDefinition[] = [
  ...propertyPermissions,
  ...leadPermissions,
  ...customerPermissions,
  ...dealPermissions,
  ...invoicePermissions,
  ...cmsPermissions,
  ...templatePermissions,
  ...systemPermissions,
];

export const PERMISSION_MAP = new Map<string, PermissionDefinition>(
  PERMISSION_REGISTRY.map((p) => [p.key, p])
);

export const MODULE_ORDER: { key: ModuleName; label: string; description: string }[] = [
  { key: 'properties', label: 'Properties & 3D Units', description: 'Real estate assets, listings, and 3D floorplans' },
  { key: 'leads', label: 'Leads & Inquiries', description: 'Prospects, inquiries, and customer conversions' },
  { key: 'customers', label: 'Customer Accounts', description: 'Buyer records, KYC files, and portal access' },
  { key: 'deals', label: 'Deals & Contracts', description: 'Sales pipeline, unit reservations, and closing stages' },
  { key: 'invoices', label: 'Billing & Invoices', description: 'Demands, milestone dues, and payment recording' },
  { key: 'cms', label: 'CMS & Website', description: 'Visual page editor, layouts, and public publishing' },
  { key: 'templates', label: 'Template Studio', description: 'Omnichannel communication templates and variables' },
  { key: 'users', label: 'Staff & Users', description: 'Team access, invitations, and active sessions' },
  { key: 'roles', label: 'Roles & RBAC', description: 'Security roles, capability assignments, and scoping' },
  { key: 'audit', label: 'Security Audit', description: 'Tamper-evident logs and system activity monitoring' },
  { key: 'system', label: 'System & Platform', description: 'Platform configurations, feature flags, and integrations' },
];

export function getAllPermissions(): PermissionDefinition[] {
  return [...PERMISSION_REGISTRY];
}

export function getPermission(key: string): PermissionDefinition | undefined {
  return PERMISSION_MAP.get(key);
}

export function isValidPermission(key: string): boolean {
  return PERMISSION_MAP.has(key);
}

export function getPermissionsByModule(module: ModuleName): PermissionDefinition[] {
  return PERMISSION_REGISTRY.filter((p) => p.module === module);
}

export function getPermissionDependencies(key: string): string[] {
  const perm = getPermission(key);
  return perm?.dependencies || [];
}

/**
 * Validates and normalizes role permission assignments.
 * Ensures only valid registered capability keys are stored,
 * ensures valid scopes, and resolves dependencies.
 */
export function validateAndNormalizeAssignments(
  assignments: { key: string; enabled?: boolean; scope?: string }[]
): {
  normalized: RolePermissionAssignment[];
  errors: string[];
} {
  const errors: string[] = [];
  const assignedMap = new Map<string, { enabled: boolean; scope?: DataScope }>();

  for (const item of assignments) {
    if (!isValidPermission(item.key)) {
      errors.push(`Invalid permission key: '${item.key}'`);
      continue;
    }
    const def = getPermission(item.key)!;
    const isEnabled = !!item.enabled;

    let validScope: DataScope | undefined = undefined;
    if (def.supportedScopes && def.supportedScopes.length > 0) {
      if (item.scope && def.supportedScopes.includes(item.scope as DataScope)) {
        validScope = item.scope as DataScope;
      } else {
        validScope = def.defaultScope || def.supportedScopes[0];
      }
    }

    assignedMap.set(item.key, { enabled: isEnabled, scope: validScope });
  }

  // Auto-enable required dependencies if an action requires a read capability
  for (const [key, val] of Array.from(assignedMap.entries())) {
    if (val.enabled) {
      const def = getPermission(key);
      if (def?.dependencies) {
        for (const depKey of def.dependencies) {
          const depAssignment = assignedMap.get(depKey);
          if (!depAssignment || !depAssignment.enabled) {
            const depDef = getPermission(depKey);
            assignedMap.set(depKey, {
              enabled: true,
              scope: depAssignment?.scope || depDef?.defaultScope || 'all',
            });
          }
        }
      }
    }
  }

  const normalized: RolePermissionAssignment[] = Array.from(assignedMap.entries()).map(
    ([key, data]) => ({
      key,
      enabled: data.enabled,
      scope: data.scope,
    })
  );

  return { normalized, errors };
}

/**
 * Default starter role presets to accelerate deployment without hardcoding.
 */
export interface RolePreset {
  id: string;
  name: string;
  description: string;
  assignments: RolePermissionAssignment[];
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'preset-sales-agent',
    name: 'Sales Agent',
    description: 'Handles assigned buyer leads, unit viewings, and drafting reservations.',
    assignments: [
      { key: 'property.list', enabled: true, scope: 'all' },
      { key: 'property.view', enabled: true, scope: 'all' },
      { key: 'lead.list', enabled: true, scope: 'assigned' },
      { key: 'lead.view', enabled: true, scope: 'assigned' },
      { key: 'lead.create', enabled: true },
      { key: 'lead.edit', enabled: true, scope: 'assigned' },
      { key: 'customer.list', enabled: true, scope: 'assigned' },
      { key: 'customer.view', enabled: true, scope: 'assigned' },
      { key: 'deal.list', enabled: true, scope: 'assigned' },
      { key: 'deal.view', enabled: true, scope: 'assigned' },
      { key: 'deal.create', enabled: true },
    ],
  },
  {
    id: 'preset-sales-manager',
    name: 'Sales Manager',
    description: 'Supervises sales team, pipeline distribution, and deals across all agents.',
    assignments: [
      { key: 'property.list', enabled: true, scope: 'all' },
      { key: 'property.view', enabled: true, scope: 'all' },
      { key: 'lead.list', enabled: true, scope: 'all' },
      { key: 'lead.view', enabled: true, scope: 'all' },
      { key: 'lead.create', enabled: true },
      { key: 'lead.edit', enabled: true, scope: 'all' },
      { key: 'lead.assign', enabled: true, scope: 'all' },
      { key: 'lead.convert_customer', enabled: true },
      { key: 'customer.list', enabled: true, scope: 'all' },
      { key: 'customer.view', enabled: true, scope: 'all' },
      { key: 'customer.create', enabled: true },
      { key: 'customer.edit', enabled: true, scope: 'all' },
      { key: 'deal.list', enabled: true, scope: 'all' },
      { key: 'deal.view', enabled: true, scope: 'all' },
      { key: 'deal.create', enabled: true },
      { key: 'deal.edit', enabled: true, scope: 'all' },
      { key: 'deal.close', enabled: true },
    ],
  },
  {
    id: 'preset-accounts',
    name: 'Accounts & Finance',
    description: 'Manages payment demands, milestones, tax invoices, and payment receipts.',
    assignments: [
      { key: 'property.list', enabled: true, scope: 'all' },
      { key: 'property.view', enabled: true, scope: 'all' },
      { key: 'deal.list', enabled: true, scope: 'all' },
      { key: 'deal.view', enabled: true, scope: 'all' },
      { key: 'invoice.list', enabled: true, scope: 'all' },
      { key: 'invoice.view', enabled: true, scope: 'all' },
      { key: 'invoice.download_pdf', enabled: true },
      { key: 'invoice.send_email', enabled: true },
      { key: 'invoice.record_payment', enabled: true },
    ],
  },
  {
    id: 'preset-content-manager',
    name: 'Content & Marketing Manager',
    description: 'Designs landing pages, manages 3D listings, and customizes messaging templates.',
    assignments: [
      { key: 'property.list', enabled: true, scope: 'all' },
      { key: 'property.view', enabled: true, scope: 'all' },
      { key: 'property.create', enabled: true },
      { key: 'property.edit', enabled: true, scope: 'all' },
      { key: 'property.publish', enabled: true },
      { key: 'cms.access', enabled: true },
      { key: 'cms.edit', enabled: true },
      { key: 'cms.publish', enabled: true },
      { key: 'template.access', enabled: true },
      { key: 'template.create', enabled: true },
      { key: 'template.edit', enabled: true },
      { key: 'template.publish', enabled: true },
    ],
  },
];
