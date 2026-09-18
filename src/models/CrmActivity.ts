import mongoose, { Schema, Document, Model } from 'mongoose';

export type CrmActivityType =
  | 'internal_note'
  | 'phone_call'
  | 'email'
  | 'whatsapp'
  | 'meeting'
  | 'system_event'
  | 'lead_created'
  | 'lead_assigned'
  | 'lead_converted'
  | 'viewing_scheduled'
  | 'deal_created'
  | 'stage_changed'
  | 'invoice_issued'
  | 'payment_recorded';

export type CrmRelatedType = 'lead' | 'customer' | 'deal' | 'property' | 'appointment' | 'invoice';

export interface ICrmActivity extends Document {
  relatedType: CrmRelatedType;
  relatedId: mongoose.Types.ObjectId;
  type: CrmActivityType;
  title: string;
  content: string;
  authorId?: mongoose.Types.ObjectId;
  authorName?: string;
  visibility: 'internal' | 'customer_facing';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CrmActivitySchema = new Schema<ICrmActivity>(
  {
    relatedType: {
      type: String,
      enum: ['lead', 'customer', 'deal', 'property', 'appointment', 'invoice'],
      required: true,
      index: true,
    },
    relatedId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: {
      type: String,
      enum: [
        'internal_note',
        'phone_call',
        'email',
        'whatsapp',
        'meeting',
        'system_event',
        'lead_created',
        'lead_assigned',
        'lead_converted',
        'viewing_scheduled',
        'deal_created',
        'stage_changed',
        'invoice_issued',
        'payment_recorded',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User' },
    authorName: { type: String, default: 'System' },
    visibility: {
      type: String,
      enum: ['internal', 'customer_facing'],
      default: 'internal',
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

CrmActivitySchema.index({ relatedType: 1, relatedId: 1, createdAt: -1 });

export const CrmActivity: Model<ICrmActivity> =
  mongoose.models.CrmActivity || mongoose.model<ICrmActivity>('CrmActivity', CrmActivitySchema);
