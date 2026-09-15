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

export interface ISystemBranding {
  websiteName: string;
  headerLogo: string;
  footerLogo: string;
  favicon: string;
  headerLogoLight?: string;
  headerLogoDark?: string;
  footerLogoLight?: string;
  footerLogoDark?: string;
}

export interface ISystemConfig extends Document {
  singletonKey?: string;
  setupCompleted: boolean;
  setupVersion: string;
  setupCompletedAt?: Date;
  developerUserId?: mongoose.Types.ObjectId;
  ownerUserId?: mongoose.Types.ObjectId;
  branding: ISystemBranding;
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
  createdAt: Date;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    singletonKey: { type: String, default: 'PRIMARY_SYSTEM_CONFIG', unique: true },
    setupCompleted: { type: Boolean, default: false, index: true },
    setupVersion: { type: String, default: '1.0.0' },
    setupCompletedAt: { type: Date },
    developerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    ownerUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    branding: {
      websiteName: { type: String, default: 'Aura Heights Luxury Estates', trim: true },
      headerLogo: { type: String, default: '' },
      footerLogo: { type: String, default: '' },
      favicon: { type: String, default: '/favicon.ico' },
      headerLogoLight: { type: String, default: '' },
      headerLogoDark: { type: String, default: '' },
      footerLogoLight: { type: String, default: '' },
      footerLogoDark: { type: String, default: '' },
    },
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

// Pre-save singleton validation: prevent duplicate system config records
SystemConfigSchema.pre<ISystemConfig>('save', async function (next) {
  const existing = await (this.constructor as Model<ISystemConfig>).findOne({
    _id: { $ne: this._id },
  });
  if (existing) {
    return next(new Error('Only one persistent SystemConfig document is permitted in the database.'));
  }
  next();
});

export const SystemConfig: Model<ISystemConfig> =
  mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
