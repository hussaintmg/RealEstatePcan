import mongoose from 'mongoose';
import { TokenPayload } from './auth';
import { Role, IRole } from '../models/Role';
import { User } from '../models/User';
import { DataScope } from './permissions/types';
import { getPermission } from './permissions/registry';

export async function getUserRole(roleId?: string): Promise<any | null> {
  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) return null;
  return Role.findById(roleId).lean();
}

/**
 * Checks if the given user has permission for a specific capability key.
 * Can optionally check against a resource instance for ownership/assignment.
 */
export function can(
  user: TokenPayload,
  role: any | null,
  capabilityKey: string,
  resource?: any
): boolean {
  // 1. Developer has full platform-level privileges
  if (user.isDeveloper) {
    return true;
  }

  // 2. Primary Owner has complete operational control across the workspace,
  // but cannot mutate core developer platform configurations
  if (user.isOwner) {
    if (
      capabilityKey === 'system.configure' ||
      capabilityKey.startsWith('developer_settings') ||
      capabilityKey === 'feature_flags.manage'
    ) {
      return false; // Reserved exclusively for platform developer
    }
    return true;
  }

  // 3. Customer Portal Account Scoping:
  // If an authenticated user without staff role is accessing their own customer or linked record
  if (resource && (resource.userId?.toString() === user.userId || resource._id?.toString() === user.userId)) {
    if (capabilityKey.startsWith('customer.') || capabilityKey.startsWith('invoice.')) {
      return true;
    }
  }

  // 4. Staff without role cannot perform protected operations
  if (!role) {
    return false;
  }

  // 4. Check modern capabilities registry
  if (Array.isArray(role.capabilities)) {
    const cap = role.capabilities.find((c: any) => c.key === capabilityKey);
    if (cap) {
      if (!cap.enabled) return false;

      // If resource provided, verify scope constraints on resource
      if (resource) {
        const scope: DataScope = cap.scope || mapLegacyDataScope(role.dataScope);
        return checkResourceScope(user, scope, resource);
      }

      return true;
    }
  }

  // 5. Fallback mapping for legacy page-level permissions
  if (Array.isArray(role.permissions)) {
    const legacyCheck = checkLegacyPermission(role.permissions, capabilityKey);
    if (legacyCheck !== null) {
      if (!legacyCheck) return false;
      if (resource) {
        const scope = mapLegacyDataScope(role.dataScope);
        return checkResourceScope(user, scope, resource);
      }
      return true;
    }
  }

  return false;
}

/**
 * Returns the effective data scope for a capability.
 */
export function getEffectiveScope(
  user: TokenPayload,
  role: any | null,
  capabilityKey?: string
): DataScope {
  if (user.isDeveloper || user.isOwner) {
    return 'all';
  }

  if (!role) {
    return 'own';
  }

  if (capabilityKey && Array.isArray(role.capabilities)) {
    const cap = role.capabilities.find((c: any) => c.key === capabilityKey);
    if (cap && cap.scope) {
      return cap.scope;
    }
  }

  return mapLegacyDataScope(role.dataScope);
}

/**
 * Enforces data scoping at the database query layer (MongoDB filter).
 */
export async function applyDataScope(
  baseFilter: Record<string, any>,
  user: TokenPayload,
  role: any | null,
  capabilityKey?: string
): Promise<Record<string, any>> {
  // Developer and Owner see all data within workspace
  if (user.isDeveloper || user.isOwner) {
    return baseFilter;
  }

  const scope = getEffectiveScope(user, role, capabilityKey);
  const userObjectId = new mongoose.Types.ObjectId(user.userId);

  switch (scope) {
    case 'all':
      return baseFilter;

    case 'own':
      return {
        ...baseFilter,
        createdBy: userObjectId,
      };

    case 'assigned':
      return {
        ...baseFilter,
        $or: [
          { assignedTo: userObjectId },
          { assignedUserId: userObjectId },
          { assignedAgent: userObjectId },
          { createdBy: userObjectId },
          { userId: userObjectId },
        ],
      };

    case 'team': {
      // Find users that share the same role or team
      if (role?._id) {
        const teamUsers = await User.find({ roleId: role._id }).select('_id').lean();
        const userIds = [userObjectId, ...teamUsers.map((u) => u._id)];
        return {
          ...baseFilter,
          $or: [
            { assignedTo: { $in: userIds } },
            { assignedUserId: { $in: userIds } },
            { assignedAgent: { $in: userIds } },
            { createdBy: { $in: userIds } },
          ],
        };
      }
      return {
        ...baseFilter,
        createdBy: userObjectId,
      };
    }

    default:
      return {
        ...baseFilter,
        createdBy: userObjectId,
      };
  }
}

/**
 * Verifies if an in-memory resource entity falls within user's allowed scope.
 */
function checkResourceScope(user: TokenPayload, scope: DataScope, resource: any): boolean {
  if (scope === 'all') return true;

  const userStr = user.userId.toString();
  const createdByStr = resource.createdBy?.toString();
  const portalUserStr = resource.userId?.toString();
  const assignedToStr = (resource.assignedTo || resource.assignedUserId || resource.assignedAgent)?.toString();

  // If this is a customer portal user viewing their own account
  if (portalUserStr && portalUserStr === userStr) {
    return true;
  }

  if (scope === 'own') {
    return createdByStr === userStr;
  }

  if (scope === 'assigned') {
    return assignedToStr === userStr || createdByStr === userStr;
  }

  if (scope === 'team') {
    return assignedToStr === userStr || createdByStr === userStr;
  }

  return false;
}

function mapLegacyDataScope(legacyScope?: string): DataScope {
  switch (legacyScope) {
    case 'all_data':
      return 'all';
    case 'selected_roles':
    case 'selected_users':
      return 'team';
    case 'own_data':
    default:
      return 'own';
  }
}

function checkLegacyPermission(permissions: any[], capabilityKey: string): boolean | null {
  const [module, action] = capabilityKey.split('.');
  if (!module || !action) return null;

  const page = module; // e.g. properties, leads, customers, invoices
  const pagePerm = permissions.find((p) => p.page === page);
  if (!pagePerm) return null;

  if (action === 'list' || action === 'view') return !!pagePerm.read;
  if (action === 'create') return !!pagePerm.create;
  if (action === 'edit') return !!pagePerm.update;
  if (action === 'archive' || action === 'delete') return !!pagePerm.delete;
  if (action === 'download_pdf') return !!pagePerm.download_pdf;
  if (action === 'send_email') return !!pagePerm.send_email;
  if (action === 'send_whatsapp') return !!pagePerm.send_whatsapp;

  return null;
}

/**
 * Retained for backwards compatibility with any existing components.
 */
export function hasPermission(
  user: TokenPayload,
  role: any | null,
  page: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'download_pdf' | 'send_email' | 'send_whatsapp'
): boolean {
  const actionMap: Record<string, string> = {
    read: 'view',
    create: 'create',
    update: 'edit',
    delete: 'archive',
    download_pdf: 'download_pdf',
    send_email: 'send_email',
    send_whatsapp: 'send_whatsapp',
  };

  const capAction = actionMap[action] || action;
  const capabilityKey = `${page}.${capAction}`;

  return can(user, role, capabilityKey);
}
