import mongoose, { Schema, Document, Model } from 'mongoose';

export type DealStage =
  | 'inquiry'
  | 'viewing_scheduled'
  | 'offer_submitted'
  | 'under_contract'
  | 'deposit_received'
  | 'closed_won'
  | 'closed_lost';

export interface IDealMilestone {
  title: string;
  percentage: number;
  amount: number;
  dueDate?: Date;
  status: 'pending' | 'invoiced' | 'paid';
  invoiceId?: mongoose.Types.ObjectId;
  sequence: number;
}

export interface IDeal extends Document {
  title: string;
  propertyId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  assignedAgentId?: mongoose.Types.ObjectId;
  stage: DealStage;
  dealValue: number;
  agreedPrice?: number;
  bookingAmount?: number;
  discount?: number;
  paymentPlanType?: 'full_payment' | 'milestone_plan' | 'custom';
  milestones: IDealMilestone[];
  currency: string;
  expectedCloseDate?: Date;
  commissionRate?: number;
  commissionAmount?: number;
  invoices: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DealMilestoneSchema = new Schema<IDealMilestone>(
  {
    title: { type: String, required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'invoiced', 'paid'],
      default: 'pending',
    },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    sequence: { type: Number, default: 1 },
  },
  { _id: true }
);

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    stage: {
      type: String,
      enum: [
        'inquiry',
        'viewing_scheduled',
        'offer_submitted',
        'under_contract',
        'deposit_received',
        'closed_won',
        'closed_lost',
      ],
      default: 'inquiry',
      index: true,
    },
    dealValue: { type: Number, required: true, min: 0 },
    agreedPrice: { type: Number, min: 0 },
    bookingAmount: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    paymentPlanType: {
      type: String,
      enum: ['full_payment', 'milestone_plan', 'custom'],
      default: 'milestone_plan',
    },
    milestones: [DealMilestoneSchema],
    currency: { type: String, default: 'USD', uppercase: true },
    expectedCloseDate: { type: Date },
    commissionRate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    invoices: [{ type: Schema.Types.ObjectId, ref: 'Invoice' }],
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Deal: Model<IDeal> =
  mongoose.models.Deal || mongoose.model<IDeal>('Deal', DealSchema);
