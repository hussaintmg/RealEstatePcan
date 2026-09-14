import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAiProviderConfig {
  id: string;
  name: string;
  type: 'gemini' | 'openai' | 'groq' | 'custom';
  apiKey: string;
  baseUrl?: string;
  modelName: string;
  priority: number;
  isEnabled: boolean;
}

export interface ISystemFeatures {
  globalSearch: boolean;
  aiAssistant: boolean;
  customerPortal: boolean;
  playcanvas3d: boolean;
  scrollVideoFrames: boolean;
  cms: boolean;
  templateEditors: boolean;
  themeToggle: boolean;
  realtimeAuditLogs: boolean;
}

export interface ISystemConfig extends Document {
  features: ISystemFeatures;
  storageProvider: 'supabase' | 'local';
  supabaseConfig: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    bucket: string;
  };
  aiProviders: IAiProviderConfig[];
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    features: {
      globalSearch: { type: Boolean, default: true },
      aiAssistant: { type: Boolean, default: true },
      customerPortal: { type: Boolean, default: true },
      playcanvas3d: { type: Boolean, default: true },
      scrollVideoFrames: { type: Boolean, default: true },
      cms: { type: Boolean, default: true },
      templateEditors: { type: Boolean, default: true },
      themeToggle: { type: Boolean, default: true },
      realtimeAuditLogs: { type: Boolean, default: true },
    },
    storageProvider: {
      type: String,
      enum: ['supabase', 'local'],
      default: 'supabase',
    },
    supabaseConfig: {
      url: { type: String, default: '' },
      anonKey: { type: String, default: '' },
      serviceRoleKey: { type: String, default: '' },
      bucket: { type: String, default: 'real-estate-assets' },
    },
    aiProviders: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['gemini', 'openai', 'groq', 'custom'], required: true },
        apiKey: { type: String, default: '' },
        baseUrl: { type: String, default: '' },
        modelName: { type: String, default: '' },
        priority: { type: Number, default: 1 },
        isEnabled: { type: Boolean, default: true },
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
