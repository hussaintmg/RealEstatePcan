import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsTemplate extends Document {
  name: string;
  slug: string;
  category: 'hero' | 'cta' | 'features' | 'portfolio' | 'forms' | 'cards' | 'page' | 'layout' | 'general';
  description?: string;
  thumbnailUrl?: string;
  templateType: 'section' | 'page' | 'layout';
  schemaData: Record<string, any>;
  isSystemPreset: boolean;
  version: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsTemplateSchema = new Schema<ICmsTemplate>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ['hero', 'cta', 'features', 'portfolio', 'forms', 'cards', 'page', 'layout', 'general'],
      default: 'general',
      index: true,
    },
    description: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    templateType: {
      type: String,
      enum: ['section', 'page', 'layout'],
      required: true,
      index: true,
    },
    schemaData: { type: Schema.Types.Mixed, required: true },
    isSystemPreset: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsTemplate: Model<ICmsTemplate> =
  mongoose.models.CmsTemplate || mongoose.model<ICmsTemplate>('CmsTemplate', CmsTemplateSchema);
