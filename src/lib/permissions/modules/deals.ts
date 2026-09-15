import { PermissionDefinition } from '../types';

export const dealPermissions: PermissionDefinition[] = [
  {
    key: 'deal.list',
    module: 'deals',
    label: 'List Deals & Reservations',
    description: 'View sales pipeline, booked units, and contract stages.',
    type: 'read',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
  },
  {
    key: 'deal.view',
    module: 'deals',
    label: 'View Deal Details',
    description: 'Inspect transaction terms, milestone payment breakdown, and commission.',
    type: 'read',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
  },
  {
    key: 'deal.create',
    module: 'deals',
    label: 'Create Deal / Reservation',
    description: 'Book a property unit for a customer and initiate sale contract.',
    type: 'write',
    dependencies: ['deal.view'],
  },
  {
    key: 'deal.edit',
    module: 'deals',
    label: 'Edit Deal Terms',
    description: 'Modify payment schedules, discounts, and escrow milestones.',
    type: 'write',
    supportedScopes: ['own', 'assigned', 'team', 'all'],
    defaultScope: 'assigned',
    dependencies: ['deal.view'],
  },
  {
    key: 'deal.close',
    module: 'deals',
    label: 'Close Deal',
    description: 'Finalize property sale, lock inventory, and trigger final handover.',
    type: 'action',
    dependencies: ['deal.edit'],
  },
];
