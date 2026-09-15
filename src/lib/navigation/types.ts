import { LucideIcon } from 'lucide-react';

export type UserRoleType = 'developer' | 'owner' | 'staff';

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  live?: boolean;
  requiredRole?: UserRoleType;
  requiredPermission?: string;
  requiredFeature?: string;
  exactMatch?: boolean;
  children?: NavigationItem[];
}

export interface NavigationSection {
  id: string;
  title: string;
  requiredRole?: UserRoleType;
  items: NavigationItem[];
}

export interface NavigationFilterContext {
  isDeveloper: boolean;
  isOwner: boolean;
  permissions?: Record<string, Record<string, boolean>>;
  effectivePermissions?: string[];
  effectiveScopes?: Record<string, string>;
  features?: Record<string, boolean | undefined>;
}
