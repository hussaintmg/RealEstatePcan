import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsSectionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists' | 'true' | 'false';
  value: any;
}

export interface ICmsSection {
  id: string;
  type: string;
  sectionKey?: string;
  sectionVersion?: string;
  customTreeOverride?: any;
  title: string;
  order: number;
  isVisible: boolean;
  content: Record<string, any>;
  props?: Record<string, any>;
  bindings?: Record<string, any>;
  responsive?: Record<string, any>;
  design?: {
    width?: string;
    maxWidth?: string;
    padding?: string;
    margin?: string;
    bgColor?: string;
    textColor?: string;
    borderRadius?: string;
    shadow?: string;
    align?: string;
    customClasses?: string;
  };
  animation?: {
    type?: 'none' | 'fade' | 'slide_up' | 'scale' | 'reveal';
    duration?: number;
    delay?: number;
    hoverEffect?: 'none' | 'lift' | 'scale' | 'glow';
  };
  conditions?: ICmsSectionCondition[];
  repeater?: {
    enabled: boolean;
    source: string;
    itemAlias: string;
  };
  globalBlockId?: mongoose.Types.ObjectId;
  customCss?: string;
}

export interface ICmsPageSeo {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface ICmsPageLayoutAssignment {
  topbarId?: mongoose.Types.ObjectId;
  navbarId?: mongoose.Types.ObjectId;
  sidebarId?: mongoose.Types.ObjectId;
  footerId?: mongoose.Types.ObjectId;
  useGlobalDefaults: boolean;
}

export interface ICmsPageVersionHistory {
  version: number;
  publishedAt: Date;
  publishedBy: mongoose.Types.ObjectId;
  snapshot: any;
  note?: string;
}

export interface ICmsCustomVariable {
  key: string;
  label: string;
  type: string;
  value: any;
}

export interface ICmsPage extends Document {
  title: string;
  slug: string;
  sections: ICmsSection[];
  status: 'draft' | 'published' | 'disabled' | 'archived';
  isPublished: boolean; // Backwards compatibility
  isSystemPage?: boolean;
  layout?: ICmsPageLayoutAssignment;
  themeId?: mongoose.Types.ObjectId;
  seo?: ICmsPageSeo;
  metaTitle?: string; // Backwards compatibility
  metaDescription?: string; // Backwards compatibility
  isDynamic?: boolean;
  dynamicSource?: string;
  version: number;
  publishedSnapshot?: Record<string, any>;
  versionHistory?: ICmsPageVersionHistory[];
  customVariables?: ICmsCustomVariable[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsPageSchema = new Schema<ICmsPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    sections: [
      {
        id: { type: String, required: true },
        type: { type: String, default: 'custom' },
        sectionKey: { type: String },
        sectionVersion: { type: String },
        customTreeOverride: { type: Schema.Types.Mixed },
        title: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isVisible: { type: Boolean, default: true },
        content: { type: Schema.Types.Mixed, default: {} },
        props: { type: Schema.Types.Mixed, default: {} },
        bindings: { type: Schema.Types.Mixed, default: {} },
        responsive: { type: Schema.Types.Mixed, default: {} },
        styles: { type: Schema.Types.Mixed, default: {} },
        design: { type: Schema.Types.Mixed, default: {} },
        animation: { type: Schema.Types.Mixed, default: {} },
        conditions: [{ type: Schema.Types.Mixed }],
        repeater: { type: Schema.Types.Mixed },
        globalBlockId: { type: Schema.Types.ObjectId, ref: 'CmsGlobalBlock' },
        customCss: { type: String, default: '' },
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'published', 'disabled', 'archived'],
      default: 'published',
      index: true,
    },
    isPublished: { type: Boolean, default: true },
    isSystemPage: { type: Boolean, default: false },
    layout: {
      topbarId: { type: Schema.Types.ObjectId, ref: 'CmsLayout' },
      navbarId: { type: Schema.Types.ObjectId, ref: 'CmsLayout' },
      sidebarId: { type: Schema.Types.ObjectId, ref: 'CmsLayout' },
      footerId: { type: Schema.Types.ObjectId, ref: 'CmsLayout' },
      useGlobalDefaults: { type: Boolean, default: true },
    },
    themeId: { type: Schema.Types.ObjectId, ref: 'CmsTheme' },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
      noIndex: { type: Boolean, default: false },
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    isDynamic: { type: Boolean, default: false },
    dynamicSource: { type: String, default: '' },
    version: { type: Number, default: 1 },
    publishedSnapshot: { type: Schema.Types.Mixed },
    versionHistory: [
      {
        version: { type: Number, required: true },
        publishedAt: { type: Date, default: Date.now },
        publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        snapshot: { type: Schema.Types.Mixed },
        note: { type: String, default: '' },
      },
    ],
    customVariables: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        type: { type: String, default: 'string' },
        value: { type: Schema.Types.Mixed, default: '' },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsPage: Model<ICmsPage> =
  mongoose.models.CmsPage || mongoose.model<ICmsPage>('CmsPage', CmsPageSchema);
