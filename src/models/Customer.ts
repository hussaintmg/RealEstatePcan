import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  userId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  linkedProperties: mongoose.Types.ObjectId[];
  invoices: mongoose.Types.ObjectId[];
  status: 'active' | 'archived';
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    linkedProperties: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
    invoices: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
