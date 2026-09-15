import { PermissionDefinition } from '../types';

export const templatePermissions: PermissionDefinition[] = [
  {
    key: 'template.access',
    module: 'templates',
    label: 'Access Template Studio',
    description: 'Browse, preview, and test messaging and notification templates.',
    type: 'read',
    requiresFeature: 'templateEditors',
  },
  {
    key: 'template.create',
    module: 'templates',
    label: 'Create Templates',
    description: 'Design new email, SMS, or WhatsApp communication layouts.',
    type: 'write',
    requiresFeature: 'templateEditors',
    dependencies: ['template.access'],
  },
  {
    key: 'template.edit',
    module: 'templates',
    label: 'Edit Templates',
    description: 'Modify dynamic parameters, copy, and formatting in communication templates.',
    type: 'write',
    requiresFeature: 'templateEditors',
    dependencies: ['template.access'],
  },
  {
    key: 'template.publish',
    module: 'templates',
    label: 'Publish / Activate Templates',
    description: 'Activate messaging templates for production dispatch across all channels.',
    type: 'action',
    requiresFeature: 'templateEditors',
    dependencies: ['template.edit'],
  },
];
