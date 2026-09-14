import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsVariable extends Document {
  key: string;
  label: string;
  category: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'image' | 'url' | 'array' | 'object';
  value: any;
  source: 'static' | 'computed' | 'settings' | 'model';
  computationExpression?: string;
  description?: string;
  isEnabled: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsVariableSchema = new Schema<ICmsVariable>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    category: { type: String, default: 'Custom', index: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'date', 'image', 'url', 'array', 'object'],
      default: 'string',
    },
    value: { type: Schema.Types.Mixed, default: '' },
    source: {
      type: String,
      enum: ['static', 'computed', 'settings', 'model'],
      default: 'static',
    },
    computationExpression: { type: String, default: '' },
    description: { type: String, default: '' },
    isEnabled: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsVariable: Model<ICmsVariable> =
  mongoose.models.CmsVariable || mongoose.model<ICmsVariable>('CmsVariable', CmsVariableSchema);
