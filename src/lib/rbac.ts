import mongoose from 'mongoose';
import { TokenPayload } from './auth';
import { Role, IRole } from '../models/Role';
import { User } from '../models/User';

export async function getUserRole(roleId?: string): Promise<any | null> {
  if (!roleId || !mongoose.Types.ObjectId.isValid(roleId)) return null;
  return Role.findById(roleId).lean();
}

export function hasPermission(
  user: TokenPayload,
  role: IRole | null,
  page: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'download_pdf' | 'send_email' | 'send_whatsapp'
): boolean {
  // Developer has full access to all system features
  if (user.isDeveloper) return true;

  // Owner has full access to standard operational pages, but cannot touch developer settings
  if (user.isOwner) {
    if (page === 'developer_settings') return false;
    return true;
  }

  // If no role assigned, deny access
  if (!role) return false;

  const pagePerm = role.permissions.find((p) => p.page === page);
  if (!pagePerm) return false;

  return !!pagePerm[action];
}

export async function applyDataScope(
  baseFilter: Record<string, any>,
  user: TokenPayload,
  role: IRole | null
): Promise<Record<string, any>> {
  // Developer and Owner see all data
  if (user.isDeveloper || user.isOwner) {
    return baseFilter;
  }

  if (!role) {
    return { ...baseFilter, createdBy: new mongoose.Types.ObjectId(user.userId) };
  }

  switch (role.dataScope) {
    case 'all_data':
      return baseFilter;

    case 'own_data':
      return { ...baseFilter, createdBy: new mongoose.Types.ObjectId(user.userId) };

    case 'selected_users': {
      const userIds = [
        new mongoose.Types.ObjectId(user.userId),
        ...(role.allowedUserIds || []).map((id) => new mongoose.Types.ObjectId(id.toString())),
      ];
      return { ...baseFilter, createdBy: { $in: userIds } };
    }

    case 'selected_roles': {
      if (!role.allowedRoleIds || role.allowedRoleIds.length === 0) {
        return { ...baseFilter, createdBy: new mongoose.Types.ObjectId(user.userId) };
      }
      const usersInRoles = await User.find({
        roleId: { $in: role.allowedRoleIds },
      })
        .select('_id')
        .lean();

      const userIds = [
        new mongoose.Types.ObjectId(user.userId),
        ...usersInRoles.map((u) => u._id),
      ];
      return { ...baseFilter, createdBy: { $in: userIds } };
    }

    default:
      return { ...baseFilter, createdBy: new mongoose.Types.ObjectId(user.userId) };
  }
}
