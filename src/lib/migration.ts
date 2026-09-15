import { connectToDatabase } from './db';
import { SystemConfig } from '../models/SystemConfig';
import { User } from '../models/User';
import { CmsTheme } from '../models/CmsTheme';

export interface MigrationResult {
  migrated: boolean;
  reason: string;
  developerFound?: boolean;
  ownerFound?: boolean;
  setupCompleted: boolean;
}

/**
 * Ensures existing installations with pre-existing Developer or Owner accounts
 * are migrated smoothly into the persistent SystemConfig setupCompleted architecture
 * without locking administrators out or resetting credentials.
 */
export async function runLegacySetupMigration(): Promise<MigrationResult> {
  await connectToDatabase();

  let config = await SystemConfig.findOne();
  const existingDev = await User.findOne({ isDeveloper: true });
  const existingOwner = await User.findOne({ isOwner: true });

  // If setup is already explicitly marked as completed, nothing to migrate
  if (config && config.setupCompleted === true) {
    return {
      migrated: false,
      reason: 'Setup already finalized in SystemConfig',
      developerFound: !!existingDev,
      ownerFound: !!existingOwner,
      setupCompleted: true,
    };
  }

  // If a developer or owner exists from a legacy installation, safely mark setup completed
  if (existingDev || existingOwner) {
    if (!config) {
      config = new SystemConfig({
        features: {
          globalSearch: true,
          aiAssistant: true,
          customerPortal: true,
          playcanvas3d: true,
          scrollVideoFrames: true,
          cms: true,
          templateEditors: true,
          themeToggle: true,
          realtimeAuditLogs: true,
        },
        storageProvider: 'supabase',
        supabaseConfig: {
          url: process.env.SUPABASE_URL || '',
          anonKey: process.env.SUPABASE_ANON_KEY || '',
          serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          bucket: 'real-estate-assets',
        },
      });
    }

    // Attempt to pull branding from existing default CMS theme if available
    let websiteName = 'Aura Heights Luxury Estates';
    let headerLogo = '';
    let footerLogo = '';
    let favicon = '/favicon.ico';

    try {
      const defaultTheme = await CmsTheme.findOne({ isDefault: true }).lean();
      if (defaultTheme?.brand) {
        if (defaultTheme.brand.companyName) websiteName = defaultTheme.brand.companyName;
        if (defaultTheme.brand.logoPrimary) headerLogo = defaultTheme.brand.logoPrimary;
        if (defaultTheme.brand.footerLogo) footerLogo = defaultTheme.brand.footerLogo;
        if (defaultTheme.brand.favicon) favicon = defaultTheme.brand.favicon;
      }
    } catch {
      // Use defaults
    }

    config.setupCompleted = true;
    config.setupVersion = '1.0.0';
    config.setupCompletedAt = config.setupCompletedAt || new Date();
    if (existingDev) config.developerUserId = existingDev._id as any;
    if (existingOwner) config.ownerUserId = existingOwner._id as any;
    config.branding = {
      websiteName: config.branding?.websiteName || websiteName,
      headerLogo: config.branding?.headerLogo || headerLogo,
      footerLogo: config.branding?.footerLogo || footerLogo,
      favicon: config.branding?.favicon || favicon,
      headerLogoLight: config.branding?.headerLogoLight || '',
      headerLogoDark: config.branding?.headerLogoDark || '',
      footerLogoLight: config.branding?.footerLogoLight || '',
      footerLogoDark: config.branding?.footerLogoDark || '',
    };

    await config.save();

    return {
      migrated: true,
      reason: 'Migrated legacy installation with existing administrators to completed setup state',
      developerFound: !!existingDev,
      ownerFound: !!existingOwner,
      setupCompleted: true,
    };
  }

  // Fresh database: no administrators found, setup remains false
  return {
    migrated: false,
    reason: 'Fresh deployment detected; awaiting initial setup wizard',
    developerFound: false,
    ownerFound: false,
    setupCompleted: false,
  };
}
