import { PermissionDefinition } from '../types';

export const cmsPermissions: PermissionDefinition[] = [
  {
    key: 'cms.access',
    module: 'cms',
    label: 'Access CMS Studio',
    description: 'Open website visual designer, layout managers, and asset libraries.',
    type: 'read',
    requiresFeature: 'cms',
  },
  {
    key: 'cms.edit',
    module: 'cms',
    label: 'Edit CMS Content',
    description: 'Draft page copy, adjust design variables, and arrange sections.',
    type: 'write',
    requiresFeature: 'cms',
    dependencies: ['cms.access'],
  },
  {
    key: 'cms.publish',
    module: 'cms',
    label: 'Publish Live CMS Pages',
    description: 'Deploy drafted content and design alterations directly to the public website.',
    type: 'action',
    dangerous: true,
    requiresFeature: 'cms',
    dependencies: ['cms.edit'],
  },
];
