import { PermissionDefinition } from '../types';

export const customerPermissions: PermissionDefinition[] = [
  {
    key: 'customer.list',
    module: 'customers',
    label: 'List Customers',
    description: 'View customer directory and basic client account profiles.',
    type: 'read',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
  },
  {
    key: 'customer.view',
    module: 'customers',
    label: 'View Customer Details',
    description: 'Inspect full customer history, KYC documents, and portal access status.',
    type: 'read',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
  },
  {
    key: 'customer.create',
    module: 'customers',
    label: 'Create Customer',
    description: 'Directly register a new buyer, investor, or client account.',
    type: 'write',
    dependencies: ['customer.view'],
  },
  {
    key: 'customer.edit',
    module: 'customers',
    label: 'Edit Customer',
    description: 'Update customer contact info, investment preferences, and assigned advisor.',
    type: 'write',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
    dependencies: ['customer.view'],
  },
  {
    key: 'customer.archive',
    module: 'customers',
    label: 'Archive Customer',
    description: 'Deactivate customer profile and revoke portal access.',
    type: 'write',
    dangerous: true,
    dependencies: ['customer.edit'],
  },
];
