import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILead extends Document {
  fullName: string;
  email: string;
  phone: string;
  budget?: number;
  propertyInterest?: mongoose.Types.ObjectId;
  status: 'new' | 'contacted' | 'negotiating' | 'converted' | 'lost';
  source: string;
  notes?: string;
  assignedAgent?: mongoose.Types.ObjectId;
  convertedToCustomer?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    budget: { type: Number, default: 0 },
    propertyInterest: { type: Schema.Types.ObjectId, ref: 'Property' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'negotiating', 'converted', 'lost'],
      default: 'new',
    },
    source: { type: String, default: 'website' },
    notes: { type: String, default: '' },
    assignedAgent: { type: Schema.Types.ObjectId, ref: 'User' },
    convertedToCustomer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
