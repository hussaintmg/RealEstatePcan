import { SystemConfig, ISystemConfig } from '../models/SystemConfig';
import { User, IUser } from '../models/User';
import { CmsTheme } from '../models/CmsTheme';
import { hashPassword } from './auth';
import { connectToDatabase } from './db';
import { recordAuditEvent } from './auditLogger';

export interface SetupDeveloperInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface SetupOwnerInput {
  fullName: string;
  email: string;
  password?: string;
  companyName?: string;
}

export interface SetupBrandingInput {
  websiteName: string;
  headerLogo?: string;
  footerLogo?: string;
  favicon?: string;
  headerLogoLight?: string;
  headerLogoDark?: string;
  footerLogoLight?: string;
  footerLogoDark?: string;
}

export interface InitializeSetupPayload {
  developer: SetupDeveloperInput;
  owner?: SetupOwnerInput;
  branding: SetupBrandingInput;
}

export interface SetupStatusResult {
  setupCompleted: boolean;
  setupVersion?: string;
  setupCompletedAt?: string;
  websiteName: string;
  headerLogo: string;
  footerLogo: string;
  favicon: string;
  developerExists: boolean;
  ownerExists: boolean;
}

export async function getSetupStatus(): Promise<SetupStatusResult> {
  await connectToDatabase();

  const config = await SystemConfig.findOne().lean();
  const developerCount = await User.countDocuments({ isDeveloper: true });
  const ownerCount = await User.countDocuments({ isOwner: true });

  const setupCompleted = !!config?.setupCompleted;

  return {
    setupCompleted,
    setupVersion: config?.setupVersion || '1.0.0',
    setupCompletedAt: config?.setupCompletedAt ? new Date(config.setupCompletedAt).toISOString() : undefined,
    websiteName: config?.branding?.websiteName || 'Aura Heights Luxury Estates',
    headerLogo: config?.branding?.headerLogo || '',
    footerLogo: config?.branding?.footerLogo || '',
    favicon: config?.branding?.favicon || '/favicon.ico',
    developerExists: developerCount > 0,
    ownerExists: ownerCount > 0,
  };
}

export async function initializeSetup(payload: InitializeSetupPayload) {
  const startTime = Date.now();
  await connectToDatabase();

  // 1. Audit start of setup
  recordAuditEvent({
    method: 'POST',
    path: '/api/setup/initialize',
    statusCode: 102,
    durationMs: 0,
    userEmail: payload.developer?.email,
    error: 'setup.started',
  });

  // 1. Validate Developer & Branding inputs first
  const devName = payload.developer?.fullName?.trim();
  const devEmail = payload.developer?.email?.trim().toLowerCase();
  const devPassword = payload.developer?.password;
  const devConfirm = payload.developer?.confirmPassword;

  if (!devName || !devEmail || !devPassword) {
    throw new Error('VALIDATION_ERROR: Developer full name, email, and password are required.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(devEmail)) {
    throw new Error('VALIDATION_ERROR: Invalid Developer email address format.');
  }

  if (devPassword.length < 8) {
    throw new Error('VALIDATION_ERROR: Developer password must be at least 8 characters long.');
  }

  if (devConfirm !== undefined && devPassword !== devConfirm) {
    throw new Error('VALIDATION_ERROR: Developer password and confirmation do not match.');
  }

  // 2. Race condition & Database Invariant Checks
  let config = await SystemConfig.findOne();
  if (config && config.setupCompleted) {
    throw new Error('SETUP_ALREADY_COMPLETED: Platform setup has already been completed.');
  }

  const existingDev = await User.findOne({ isDeveloper: true });
  if (existingDev) {
    throw new Error('DEVELOPER_ALREADY_EXISTS: A platform Developer account already exists.');
  }

  const existingEmailUser = await User.findOne({ email: devEmail });
  if (existingEmailUser) {
    throw new Error('EMAIL_IN_USE: Developer email is already registered in the system.');
  }

  // 4. Create Developer Account
  const devPasswordHash = await hashPassword(devPassword);
  const developerUser = await User.create({
    fullName: devName,
    email: devEmail,
    passwordHash: devPasswordHash,
    isDeveloper: true,
    isOwner: false,
    isActive: true,
  });

  recordAuditEvent({
    method: 'POST',
    path: '/api/setup/initialize',
    statusCode: 201,
    durationMs: Date.now() - startTime,
    userId: developerUser._id.toString(),
    userEmail: developerUser.email,
    error: 'developer.created',
  });

  // 5. Optional / Configured Single Owner Setup
  let ownerUser: IUser | null = null;
  if (payload.owner && payload.owner.fullName && payload.owner.email) {
    const ownerName = payload.owner.fullName.trim();
    const ownerEmail = payload.owner.email.trim().toLowerCase();
    const ownerPass = payload.owner.password || 'OwnerSecure2026!';
    const companyName = payload.owner.companyName?.trim() || '';

    if (!emailRegex.test(ownerEmail)) {
      throw new Error('VALIDATION_ERROR: Invalid Owner email address format.');
    }

    if (ownerEmail === devEmail) {
      throw new Error('VALIDATION_ERROR: Owner email cannot be identical to Developer email.');
    }

    const existingOwnerEmail = await User.findOne({ email: ownerEmail });
    if (existingOwnerEmail) {
      throw new Error('EMAIL_IN_USE: Owner email is already registered.');
    }

    const existingOwner = await User.findOne({ isOwner: true });
    if (existingOwner) {
      throw new Error('OWNER_ALREADY_EXISTS: A primary Owner account already exists.');
    }

    const ownerPasswordHash = await hashPassword(ownerPass);
    ownerUser = await User.create({
      fullName: ownerName,
      email: ownerEmail,
      passwordHash: ownerPasswordHash,
      companyName,
      isDeveloper: false,
      isOwner: true,
      isActive: true,
      createdBy: developerUser._id,
    });

    recordAuditEvent({
      method: 'POST',
      path: '/api/setup/initialize',
      statusCode: 201,
      durationMs: Date.now() - startTime,
      userId: ownerUser._id.toString(),
      userEmail: ownerUser.email,
      error: 'owner.created',
    });
  }

  // 6. Persist System Configuration with Website Identity and 3 Independent Branding Assets
  const websiteName = payload.branding?.websiteName?.trim() || 'Aura Heights Luxury Estates';
  const headerLogo = payload.branding?.headerLogo?.trim() || '';
  const footerLogo = payload.branding?.footerLogo?.trim() || '';
  const favicon = payload.branding?.favicon?.trim() || '/favicon.ico';
  const headerLogoLight = payload.branding?.headerLogoLight?.trim() || '';
  const headerLogoDark = payload.branding?.headerLogoDark?.trim() || '';
  const footerLogoLight = payload.branding?.footerLogoLight?.trim() || '';
  const footerLogoDark = payload.branding?.footerLogoDark?.trim() || '';

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
      aiProviders: [
        {
          id: 'gemini-primary',
          name: 'Google Gemini 2.0 Flash',
          type: 'gemini',
          apiKey: process.env.GEMINI_API_KEY || '',
          modelName: 'gemini-2.0-flash',
          priority: 1,
          isEnabled: true,
        },
      ],
    });
  }

  config.setupCompleted = true;
  config.setupVersion = '1.0.0';
  config.setupCompletedAt = new Date();
  config.developerUserId = developerUser._id as any;
  if (ownerUser) {
    config.ownerUserId = ownerUser._id as any;
  }
  config.branding = {
    websiteName,
    headerLogo,
    footerLogo,
    favicon,
    headerLogoLight,
    headerLogoDark,
    footerLogoLight,
    footerLogoDark,
  };
  config.updatedBy = developerUser._id as any;

  await config.save();

  // 7. Synchronize default CmsTheme brand settings so existing CMS layouts match setup
  try {
    const defaultTheme = await CmsTheme.findOne({ isDefault: true });
    if (defaultTheme) {
      defaultTheme.brand.companyName = websiteName;
      if (headerLogo) defaultTheme.brand.logoPrimary = headerLogo;
      if (footerLogo) defaultTheme.brand.footerLogo = footerLogo;
      if (favicon) defaultTheme.brand.favicon = favicon;
      await defaultTheme.save();
    }
  } catch {
    // Non-blocking sync
  }

  // 8. Seed default CMS theme and pages if needed
  try {
    const { ensureCmsSeeded } = await import('./cms/seedCmsDefaults');
    await ensureCmsSeeded();
  } catch {
    // Non-blocking
  }

  recordAuditEvent({
    method: 'POST',
    path: '/api/setup/initialize',
    statusCode: 200,
    durationMs: Date.now() - startTime,
    userId: developerUser._id.toString(),
    userEmail: developerUser.email,
    error: 'setup.completed',
  });

  return {
    success: true,
    message: 'Setup completed successfully',
    developer: {
      id: developerUser._id,
      fullName: developerUser.fullName,
      email: developerUser.email,
    },
    owner: ownerUser
      ? {
          id: ownerUser._id,
          fullName: ownerUser.fullName,
          email: ownerUser.email,
          companyName: ownerUser.companyName,
        }
      : null,
    branding: config.branding,
  };
}
