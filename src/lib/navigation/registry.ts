import {
  Sliders,
  Layout,
  FileCode,
  UserCheck,
  Activity,
  ShieldAlert,
  Home,
  Users,
  FileText,
  Globe,
  Sparkles,
  Calendar,
  Briefcase,
  CreditCard,
} from 'lucide-react';
import { NavigationSection, NavigationItem, NavigationFilterContext } from './types';

export const DASHBOARD_NAVIGATION: NavigationSection[] = [
  {
    id: 'developer-platform',
    title: 'Developer Platform',
    requiredRole: 'developer',
    items: [
      {
        id: 'dev-master',
        label: 'Developer Master Console',
        href: '/dashboard/developer',
        icon: Sliders,
        badge: 'MASTER',
        exactMatch: true,
        requiredRole: 'developer',
      },
      {
        id: 'dev-pages',
        label: 'Public Page Manager',
        href: '/dashboard/website/cms/pages',
        icon: Globe,
        requiredRole: 'developer',
        requiredFeature: 'cms',
      },
      {
        id: 'dev-studio',
        label: 'Section Studio',
        href: '/dashboard/website/cms/components/studio',
        icon: Sparkles,
        requiredRole: 'developer',
        requiredFeature: 'custom_section_studio',
      },
      {
        id: 'dev-cms',
        label: 'Custom CMS Studio',
        href: '/dashboard/website/cms',
        icon: Layout,
        requiredRole: 'developer',
        requiredFeature: 'cms',
      },
      {
        id: 'dev-templates',
        label: 'Template Suite',
        href: '/dashboard/templates',
        icon: FileCode,
        requiredRole: 'developer',
        requiredFeature: 'templateEditors',
      },
      {
        id: 'dev-roles',
        label: 'RBAC Roles & Scoping',
        href: '/dashboard/roles',
        icon: UserCheck,
        requiredRole: 'developer',
      },
      {
        id: 'dev-users',
        label: 'Users & Access Control',
        href: '/dashboard/users',
        icon: Users,
        requiredRole: 'developer',
      },
      {
        id: 'dev-audit',
        label: 'Security & Mutation Audit',
        href: '/dashboard/owner/audit-feed',
        icon: ShieldAlert,
        requiredRole: 'developer',
      },
    ],
  },
  {
    id: 'owner-overview',
    title: 'Executive Control',
    requiredRole: 'owner',
    items: [
      {
        id: 'owner-dashboard',
        label: 'Owner Overview',
        href: '/dashboard/owner',
        icon: Activity,
        exactMatch: true,
        requiredRole: 'owner',
      },
      {
        id: 'owner-users',
        label: 'Staff Access & Team',
        href: '/dashboard/users',
        icon: Users,
        requiredRole: 'owner',
      },
      {
        id: 'owner-audit',
        label: 'Real-Time Audit Stream',
        href: '/dashboard/owner/audit-feed',
        icon: ShieldAlert,
        live: true,
        requiredRole: 'owner',
        requiredFeature: 'realtimeAuditLogs',
      },
    ],
  },
  {
    id: 'operations-desk',
    title: 'Operations Desk',
    items: [
      {
        id: 'ops-properties',
        label: 'Properties & 3D Models',
        href: '/dashboard/properties',
        icon: Home,
        requiredPermission: 'property.list',
      },
      {
        id: 'ops-leads',
        label: 'Leads & Conversions',
        href: '/dashboard/leads',
        icon: Users,
        requiredPermission: 'lead.list',
      },
      {
        id: 'ops-customers',
        label: 'Converted Customers',
        href: '/dashboard/customers',
        icon: UserCheck,
        requiredPermission: 'customer.list',
      },
      {
        id: 'ops-deals',
        label: 'Deals & Contracts',
        href: '/dashboard/deals',
        icon: Briefcase,
        requiredPermission: 'deal.list',
      },
      {
        id: 'ops-appointments',
        label: 'Appointments & Viewings',
        href: '/dashboard/appointments',
        icon: Calendar,
        requiredPermission: 'lead.view',
      },
      {
        id: 'ops-invoices',
        label: 'Invoices & Demands',
        href: '/dashboard/invoices',
        icon: FileText,
        requiredPermission: 'invoice.list',
      },
      {
        id: 'ops-payments',
        label: 'Payment Ledger',
        href: '/dashboard/payments',
        icon: CreditCard,
        requiredPermission: 'invoice.view',
      },
    ],
  },
];

/**
 * Checks whether a navigation item is currently active for the given URL pathname.
 * Handles sub-routes cleanly without accidental prefix collisions.
 */
export function isRouteActive(pathname: string, href: string, exactMatch = false): boolean {
  if (!pathname || !href) return false;
  if (exactMatch || href === '/dashboard' || href === '/dashboard/owner' || href === '/dashboard/developer') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Filters navigation sections and items strictly based on user roles, permissions, and feature flags.
 */
export function filterNavigationSections(
  sections: NavigationSection[],
  ctx: NavigationFilterContext
): NavigationSection[] {
  return sections
    .filter((section) => {
      if (section.requiredRole === 'developer' && !ctx.isDeveloper) {
        return false;
      }
      if (section.requiredRole === 'owner' && !ctx.isOwner && !ctx.isDeveloper) {
        return false;
      }
      return true;
    })
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        // Developer-only items
        if (item.requiredRole === 'developer' && !ctx.isDeveloper) {
          return false;
        }

        // Owner-only items (allowed for owner and developer)
        if (item.requiredRole === 'owner' && !ctx.isOwner && !ctx.isDeveloper) {
          return false;
        }

        // Feature flag awareness
        if (item.requiredFeature && ctx.features) {
          if (ctx.features[item.requiredFeature] === false) {
            return false;
          }
        }

        // Permission awareness: Developer and Owner have access to operations; Staff must have required capability
        if (item.requiredPermission) {
          if (ctx.isDeveloper || ctx.isOwner) {
            return true;
          }

          if (ctx.effectivePermissions) {
            if (!ctx.effectivePermissions.includes(item.requiredPermission)) {
              return false;
            }
          } else if (ctx.permissions) {
            // Legacy check
            const delimiter = item.requiredPermission.includes(':') ? ':' : '.';
            const [resource, action] = item.requiredPermission.split(delimiter);
            const legacyAction = action === 'list' || action === 'view' ? 'read' : action;
            if (resource && legacyAction && !ctx.permissions[resource]?.[legacyAction]) {
              return false;
            }
          }
        }

        return true;
      });

      return {
        ...section,
        items: filteredItems,
      };
    })
    .filter((section) => section.items.length > 0);
}
