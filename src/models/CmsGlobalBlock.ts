import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsGlobalBlock extends Document {
  name: string;
  slug: string;
  type: string;
  description?: string;
  content: Record<string, any>;
  design?: Record<string, any>;
  animation?: Record<string, any>;
  usageCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsGlobalBlockSchema = new Schema<ICmsGlobalBlock>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    type: { type: String, required: true },
    description: { type: String, default: '' },
    content: { type: Schema.Types.Mixed, default: {} },
    design: { type: Schema.Types.Mixed, default: {} },
    animation: { type: Schema.Types.Mixed, default: {} },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsGlobalBlock: Model<ICmsGlobalBlock> =
  mongoose.models.CmsGlobalBlock || mongoose.model<ICmsGlobalBlock>('CmsGlobalBlock', CmsGlobalBlockSchema);
