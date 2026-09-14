import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoiceMilestone {
  name: string;
  percentage: number;
  amount: number;
  dueDate: Date;
  isPaid: boolean;
}

export interface IInvoice extends Document {
  invoiceNumber: string;
  customerId: mongoose.Types.ObjectId;
  propertyId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  milestones: IInvoiceMilestone[];
  pdfUrl?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, uppercase: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'cancelled'],
      default: 'pending',
    },
    dueDate: { type: Date, required: true },
    paidAt: { type: Date },
    milestones: [
      {
        name: { type: String, required: true },
        percentage: { type: Number, required: true },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        isPaid: { type: Boolean, default: false },
      },
    ],
    pdfUrl: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
