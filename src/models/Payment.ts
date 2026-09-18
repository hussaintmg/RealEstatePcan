import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'wire_transfer' | 'credit_card' | 'bank_deposit' | 'cheque' | 'cash';

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  dealId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionReference: string;
  receiptUrl?: string;
  notes?: string;
  paidAt: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    dealId: { type: Schema.Types.ObjectId, ref: 'Deal', index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true },
    paymentMethod: {
      type: String,
      enum: ['wire_transfer', 'credit_card', 'bank_deposit', 'cheque', 'cash'],
      default: 'wire_transfer',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed',
      index: true,
    },
    transactionReference: { type: String, required: true, unique: true },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
