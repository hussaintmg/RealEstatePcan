import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemplate extends Document {
  name: string;
  type: 'pdf' | 'email' | 'whatsapp';
  description?: string;
  subject?: string;
  contentHtml: string;
  contentJson?: Record<string, any>;
  cssStyles?: string;
  attachedPdfTemplateId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['pdf', 'email', 'whatsapp'], required: true },
    description: { type: String, default: '' },
    subject: { type: String, default: '' },
    contentHtml: { type: String, required: true },
    contentJson: { type: Schema.Types.Mixed },
    cssStyles: { type: String, default: '' },
    attachedPdfTemplateId: { type: Schema.Types.ObjectId, ref: 'Template' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Template: Model<ITemplate> =
  mongoose.models.Template || mongoose.model<ITemplate>('Template', TemplateSchema);
