import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string;
  companyName?: string;
  isDeveloper: boolean;
  isOwner: boolean;
  roleId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    companyName: { type: String, default: '', trim: true },
    isDeveloper: { type: Boolean, default: false },
    isOwner: { type: Boolean, default: false },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Pre-save validation: enforce maximum 1 primary Owner
UserSchema.pre<IUser>('save', async function (next) {
  if (this.isModified('isOwner') && this.isOwner) {
    const existingOwner = await (this.constructor as Model<IUser>).findOne({
      isOwner: true,
      _id: { $ne: this._id },
    });
    if (existingOwner) {
      return next(new Error('A primary Owner account already exists. Only one primary Owner is permitted.'));
    }
  }
  next();
});

// Database level constraint: Partial unique index guaranteeing strictly 1 active primary owner
UserSchema.index(
  { isOwner: 1 },
  { unique: true, partialFilterExpression: { isOwner: true } }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
