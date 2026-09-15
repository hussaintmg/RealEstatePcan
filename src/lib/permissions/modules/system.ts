import { PermissionDefinition } from '../types';

export const systemPermissions: PermissionDefinition[] = [
  {
    key: 'roles.manage',
    module: 'roles',
    label: 'Manage Roles & RBAC',
    description: 'Create, edit, duplicate, and archive roles and configure granular capability scoping.',
    type: 'admin',
    dangerous: true,
  },
  {
    key: 'users.manage',
    module: 'users',
    label: 'Manage Staff & Users',
    description: 'Invite, configure, activate, deactivate team members and assign security roles.',
    type: 'admin',
    dangerous: true,
  },
  {
    key: 'feature_flags.manage',
    module: 'system',
    label: 'Manage Feature Flags',
    description: 'Toggle platform capabilities, experimental features, and integration switches.',
    type: 'admin',
    dangerous: true,
  },
  {
    key: 'audit.view',
    module: 'audit',
    label: 'View Security Audit Logs',
    description: 'Inspect live and historical system security events, mutations, and user activities.',
    type: 'read',
  },
  {
    key: 'audit.export',
    module: 'audit',
    label: 'Export Audit Logs',
    description: 'Download authenticated CSV/JSON security audit logs for compliance reviews.',
    type: 'action',
    dangerous: true,
    dependencies: ['audit.view'],
  },
  {
    key: 'system.configure',
    module: 'system',
    label: 'Configure Platform & Providers',
    description: 'Manage core branding, storage backends, AI provider keys, and database maintenance.',
    type: 'admin',
    dangerous: true,
  },
];
