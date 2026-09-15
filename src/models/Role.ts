import mongoose, { Schema, Document, Model } from 'mongoose';
import { DataScope } from '../lib/permissions/types';

export type DataScopeType = 'own_data' | 'selected_roles' | 'selected_users' | 'all_data';

export interface IPagePermission {
  page: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  download_pdf: boolean;
  send_email: boolean;
  send_whatsapp: boolean;
}

export interface IRoleCapability {
  key: string;
  enabled: boolean;
  scope?: DataScope;
}

export interface IRole extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  dataScope: DataScopeType;
  allowedRoleIds?: mongoose.Types.ObjectId[];
  allowedUserIds?: mongoose.Types.ObjectId[];
  permissions: IPagePermission[];
  capabilities: IRoleCapability[];
  isSystem?: boolean;
  status: 'active' | 'archived';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dataScope: {
      type: String,
      enum: ['own_data', 'selected_roles', 'selected_users', 'all_data'],
      default: 'own_data',
    },
    allowedRoleIds: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
    allowedUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    permissions: [
      {
        page: { type: String, required: true },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        download_pdf: { type: Boolean, default: false },
        send_email: { type: Boolean, default: false },
        send_whatsapp: { type: Boolean, default: false },
      },
    ],
    capabilities: [
      {
        key: { type: String, required: true },
        enabled: { type: Boolean, default: false },
        scope: {
          type: String,
          enum: ['own', 'assigned', 'team', 'all'],
          default: 'all',
        },
      },
    ],
    isSystem: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Auto-increment version on updates to trigger cache invalidation
RoleSchema.pre<IRole>('save', function (next) {
  if (!this.isNew) {
    if (this.isModified('capabilities') || this.isModified('permissions') || this.isModified('dataScope')) {
      this.version = (this.version || 0) + 1;
    }
  }
  next();
});

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
