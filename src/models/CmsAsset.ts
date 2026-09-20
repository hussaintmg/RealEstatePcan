import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsAsset extends Document {
  title: string;
  filename: string;
  url: string;
  storageKey?: string;
  storageProvider: 'supabase' | 'local';
  fileType: 'image' | 'video' | '3d_model' | 'document' | 'icon';
  mimeType: string;
  sizeBytes: number;
  dimensions?: {
    width?: number;
    height?: number;
  };
  altText?: string;
  caption?: string;
  category: string;
  tags: string[];
  usageCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsAssetSchema = new Schema<ICmsAsset>(
  {
    title: { type: String, required: true, trim: true },
    filename: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, default: '' },
    storageProvider: { type: String, enum: ['supabase', 'local'], default: 'local' },
    fileType: {
      type: String,
      enum: ['image', 'video', '3d_model', 'document', 'icon'],
      required: true,
      index: true,
    },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
    },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    category: { type: String, default: 'general', index: true },
    tags: [{ type: String }],
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsAsset: Model<ICmsAsset> =
  mongoose.models.CmsAsset || mongoose.model<ICmsAsset>('CmsAsset', CmsAssetSchema);
