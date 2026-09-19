import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsDesignConfigVersion {
  versionNumber: number;
  publishedAt: Date;
  publishedBy: mongoose.Types.ObjectId;
  snapshot: any;
  notes?: string;
}

export interface ICmsDesignConfig extends Document {
  siteKey: string; // 'default' singleton
  status: 'draft' | 'published';
  activeThemeKey: string;
  themeMode: 'dark' | 'light' | 'system';
  themeOverrides: {
    colors?: Record<string, string>;
    metrics?: Record<string, string>;
    typography?: Record<string, string>;
  };
  publicLayouts: {
    topbarKey: string;
    mobileNavKey: string;
    footerKey: string;
    stickyNav?: boolean;
    searchEnabled?: boolean;
    ctaText?: string;
    ctaUrl?: string;
  };
  dashboardLayouts: {
    topbarKey: string;
    sidebarKey: string;
    shellKey: string;
  };
  typography: {
    pairingId?: string;
    headingFont?: string;
    bodyFont?: string;
    uiFont?: string;
    fluidScaleFactor?: number;
  };
  componentStyles: {
    buttonRadius?: string;
    cardBorder?: string;
    inputStyle?: string;
  };
  forms: {
    layoutKey: string;
  };
  skeletons: {
    activePattern: string;
    animation: 'pulse' | 'shimmer' | 'wave' | 'static';
    speedMs: number;
  };
  animations: {
    defaultEntrance: string;
    defaultHover: string;
    enableReducedMotion: boolean;
  };
  authTemplates: {
    loginKey: string;
    forgotPasswordKey: string;
    otpKey: string;
    resetPasswordKey: string;
  };
  currentVersion: number;
  publishedVersion?: number;
  versions: ICmsDesignConfigVersion[];
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsDesignConfigSchema = new Schema<ICmsDesignConfig>(
  {
    siteKey: { type: String, required: true, unique: true, default: 'default' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    activeThemeKey: { type: String, default: 'luxury-dark' },
    themeMode: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    themeOverrides: {
      colors: { type: Schema.Types.Mixed, default: {} },
      metrics: { type: Schema.Types.Mixed, default: {} },
      typography: { type: Schema.Types.Mixed, default: {} },
    },
    publicLayouts: {
      topbarKey: { type: String, default: 'topbar-minimal-centered' },
      mobileNavKey: { type: String, default: 'mob-drawer-left' },
      footerKey: { type: String, default: 'footer-large-editorial' },
      stickyNav: { type: Boolean, default: true },
      searchEnabled: { type: Boolean, default: true },
      ctaText: { type: String, default: 'Book VIP Viewing' },
      ctaUrl: { type: String, default: '/#contact' },
    },
    dashboardLayouts: {
      topbarKey: { type: String, default: 'dash-topbar-command-bar' },
      sidebarKey: { type: String, default: 'dash-sidebar-classic-grouped' },
      shellKey: { type: String, default: 'shell-standard-enterprise' },
    },
    typography: {
      pairingId: { type: String, default: 'luxury-editorial' },
      headingFont: { type: String, default: "'Cormorant Garamond', serif" },
      bodyFont: { type: String, default: "'Inter', sans-serif" },
      uiFont: { type: String, default: "'Inter', sans-serif" },
      fluidScaleFactor: { type: Number, default: 1.0 },
    },
    componentStyles: {
      buttonRadius: { type: String, default: 'var(--radius)' },
      cardBorder: { type: String, default: '1px solid var(--border)' },
      inputStyle: { type: String, default: 'standard' },
    },
    forms: {
      layoutKey: { type: String, default: 'form-stacked-standard' },
    },
    skeletons: {
      activePattern: { type: String, default: 'skel-property-card' },
      animation: { type: String, enum: ['pulse', 'shimmer', 'wave', 'static'], default: 'shimmer' },
      speedMs: { type: Number, default: 1500 },
    },
    animations: {
      defaultEntrance: { type: String, default: 'anim-reveal-up-subtle' },
      defaultHover: { type: String, default: 'hover-lift-subtle' },
      enableReducedMotion: { type: Boolean, default: false },
    },
    authTemplates: {
      loginKey: { type: String, default: 'auth-login-split-luxury' },
      forgotPasswordKey: { type: String, default: 'auth-forgot-centered' },
      otpKey: { type: String, default: 'auth-otp-centered-six-box' },
      resetPasswordKey: { type: String, default: 'auth-reset-secure-card' },
    },
    currentVersion: { type: Number, default: 1 },
    publishedVersion: { type: Number },
    versions: [
      {
        versionNumber: { type: Number, required: true },
        publishedAt: { type: Date, default: Date.now },
        publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        snapshot: { type: Schema.Types.Mixed, required: true },
        notes: { type: String, default: '' },
      },
    ],
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CmsDesignConfig: Model<ICmsDesignConfig> =
  mongoose.models.CmsDesignConfig ||
  mongoose.model<ICmsDesignConfig>('CmsDesignConfig', CmsDesignConfigSchema);
