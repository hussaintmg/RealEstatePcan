import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICmsMenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  icon?: string;
  children?: ICmsMenuItem[];
  authCondition?: 'all' | 'guest' | 'authenticated';
  roleCondition?: string[];
  visibility?: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  badge?: string;
  className?: string;
}

export interface ICmsLayoutColumn {
  id: string;
  title: string;
  links: Array<{
    id: string;
    label: string;
    url: string;
    target?: '_self' | '_blank';
    icon?: string;
  }>;
}

export interface ICmsLayout extends Document {
  type: 'topbar' | 'navbar' | 'sidebar' | 'mobile_nav' | 'footer';
  title: string;
  slug: string;
  templateVariant: string;
  isDefault: boolean;
  targetArea: 'public' | 'auth' | 'dashboard';
  content: {
    logo?: {
      type: 'brand' | 'custom';
      url?: string;
      text?: string;
      subtext?: string;
      icon?: string;
    };
    menuItems?: ICmsMenuItem[];
    actions?: Array<{
      id: string;
      label: string;
      url: string;
      variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
      icon?: string;
      authCondition?: 'all' | 'guest' | 'authenticated';
    }>;
    columns?: ICmsLayoutColumn[];
    announcement?: {
      text: string;
      link?: string;
      badge?: string;
      showDismiss?: boolean;
    };
    copyrightText?: string;
    socialLinks?: Array<{
      id: string;
      platform: string;
      url: string;
      icon: string;
    }>;
  };
  styling: {
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    isSticky?: boolean;
    isTransparent?: boolean;
    backdropBlur?: boolean;
    paddingY?: string;
    maxWidth?: string;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CmsLayoutSchema = new Schema<ICmsLayout>(
  {
    type: {
      type: String,
      enum: ['topbar', 'navbar', 'sidebar', 'mobile_nav', 'footer'],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    templateVariant: { type: String, default: 'default' },
    isDefault: { type: Boolean, default: false, index: true },
    targetArea: {
      type: String,
      enum: ['public', 'auth', 'dashboard'],
      default: 'public',
    },
    content: {
      type: Schema.Types.Mixed,
      default: {},
    },
    styling: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CmsLayout: Model<ICmsLayout> =
  mongoose.models.CmsLayout || mongoose.model<ICmsLayout>('CmsLayout', CmsLayoutSchema);
