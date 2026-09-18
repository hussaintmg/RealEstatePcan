import mongoose, { Schema, Document, Model } from 'mongoose';

export type SectionSource = 'system' | 'developer' | 'owner' | 'ai' | 'imported' | 'marketplace';

export interface ICmsSectionDefinition extends Document {
  key: string;
  version: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  thumbnail?: string;
  author: string;
  source: SectionSource;
  compatibility?: string;
  propsSchema: Record<string, any>;
  defaultProps: Record<string, any>;
  slots?: Array<{
    name: string;
    allowedTypes?: string[];
    minChildren?: number;
    maxChildren?: number;
  }>;
  layoutTree: Record<string, any>; // Declarative component primitive AST
  animations?: Record<string, any>;
  actions?: Record<string, any>;
  isPublished: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsSectionDefinitionSchema = new Schema<ICmsSectionDefinition>(
  {
    key: { type: String, required: true, unique: true, trim: true, index: true },
    version: { type: String, required: true, default: '1.0.0' },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, default: 'Custom', index: true },
    tags: [{ type: String }],
    thumbnail: { type: String, default: '' },
    author: { type: String, default: 'Developer' },
    source: {
      type: String,
      enum: ['system', 'developer', 'owner', 'ai', 'imported', 'marketplace'],
      default: 'owner',
      index: true,
    },
    compatibility: { type: String, default: '1.0.0' },
    propsSchema: { type: Schema.Types.Mixed, default: {} },
    defaultProps: { type: Schema.Types.Mixed, default: {} },
    slots: [{ type: Schema.Types.Mixed }],
    layoutTree: { type: Schema.Types.Mixed, required: true },
    animations: { type: Schema.Types.Mixed, default: {} },
    actions: { type: Schema.Types.Mixed, default: {} },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsSectionDefinition: Model<ICmsSectionDefinition> =
  mongoose.models.CmsSectionDefinition ||
  mongoose.model<ICmsSectionDefinition>('CmsSectionDefinition', CmsSectionDefinitionSchema);
