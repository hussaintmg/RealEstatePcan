import mongoose, { Schema, Document, Model } from 'mongoose';

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

export interface IRole extends Document {
  name: string;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  dataScope: DataScopeType;
  allowedRoleIds?: mongoose.Types.ObjectId[];
  allowedUserIds?: mongoose.Types.ObjectId[];
  permissions: IPagePermission[];
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
  },
  { timestamps: true }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
