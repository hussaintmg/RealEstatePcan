import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsTheme extends Document {
  name: string;
  slug: string;
  isDefault: boolean;
  brand: {
    companyName: string;
    tagline: string;
    logoPrimary: string;
    logoDark: string;
    logoLight: string;
    logoMobile: string;
    favicon: string;
    appIcon: string;
    footerLogo?: string;
    authLogo?: string;
    phone: string;
    email: string;
    address: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    success: string;
    warning: string;
    danger: string;
  };
  fonts: {
    headingFont: string;
    bodyFont: string;
    navigationFont: string;
    buttonFont?: string;
  };
  scales: {
    borderRadius: string;
    spacingScale: string;
    shadowPreset: string;
    containerMaxWidth: string;
  };
  customCss?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsThemeSchema = new Schema<ICmsTheme>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isDefault: { type: Boolean, default: false, index: true },
    brand: {
      companyName: { type: String, default: 'Aura Heights Luxury Estates' },
      tagline: { type: String, default: 'Architectural 3D Living Spaces' },
      logoPrimary: { type: String, default: '' },
      logoDark: { type: String, default: '' },
      logoLight: { type: String, default: '' },
      logoMobile: { type: String, default: '' },
      favicon: { type: String, default: '/favicon.ico' },
      appIcon: { type: String, default: '' },
      footerLogo: { type: String, default: '' },
      authLogo: { type: String, default: '' },
      phone: { type: String, default: '+92 (51) 880-9911' },
      email: { type: String, default: 'concierge@auraheights.local' },
      address: { type: String, default: 'Margalla Hillside Avenue, Sector F-7, Islamabad' },
    },
    colors: {
      primary: { type: String, default: '#3b82f6' },
      secondary: { type: String, default: '#6366f1' },
      accent: { type: String, default: '#10b981' },
      background: { type: String, default: '#0a0d14' },
      surface: { type: String, default: '#101522' },
      text: { type: String, default: '#ffffff' },
      textMuted: { type: String, default: '#94a3b8' },
      border: { type: String, default: 'rgba(255, 255, 255, 0.1)' },
      success: { type: String, default: '#10b981' },
      warning: { type: String, default: '#f59e0b' },
      danger: { type: String, default: '#ef4444' },
    },
    fonts: {
      headingFont: { type: String, default: 'Inter, sans-serif' },
      bodyFont: { type: String, default: 'Inter, sans-serif' },
      navigationFont: { type: String, default: 'Inter, sans-serif' },
      buttonFont: { type: String, default: 'Inter, sans-serif' },
    },
    scales: {
      borderRadius: { type: String, default: '0.75rem' },
      spacingScale: { type: String, default: '1rem' },
      shadowPreset: { type: String, default: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' },
      containerMaxWidth: { type: String, default: '1280px' },
    },
    customCss: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsTheme: Model<ICmsTheme> =
  mongoose.models.CmsTheme || mongoose.model<ICmsTheme>('CmsTheme', CmsThemeSchema);
