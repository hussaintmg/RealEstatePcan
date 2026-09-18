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

export interface RoleMigrationReport {
  scanned: number;
  migrated: number;
  alreadyModern: number;
  ambiguous: { roleId: string; name: string; reason: string }[];
}

/**
 * Migrates legacy roles with page-level permissions into the centralized
 * capability registry without breaking or deleting existing user access.
 */
export async function migrateLegacyRoles(): Promise<RoleMigrationReport> {
  const { Role } = await import('../models/Role');
  const { validateAndNormalizeAssignments } = await import('./permissions/registry');
  const { recordAuditEvent, computeSafeDiff } = await import('./auditLogger');
  const { invalidateRoleCache } = await import('./rbac');

  await connectToDatabase();
  const roles = await Role.find({});

  const report: RoleMigrationReport = {
    scanned: roles.length,
    migrated: 0,
    alreadyModern: 0,
    ambiguous: [],
  };

  for (const role of roles) {
    // If role already has modern capabilities defined and non-empty, skip
    if (Array.isArray(role.capabilities) && role.capabilities.length > 0) {
      report.alreadyModern++;
      continue;
    }

    // If role has legacy permissions array, map them to modern business capabilities
    if (Array.isArray(role.permissions) && role.permissions.length > 0) {
      const candidateCaps: { key: string; enabled: boolean; scope?: string }[] = [];
      const scopeVal =
        role.dataScope === 'all_data'
          ? 'all'
          : role.dataScope === 'selected_roles'
          ? 'team'
          : 'assigned';

      for (const p of role.permissions) {
        if (!p.page) continue;
        const page = p.page;

        if (page === 'properties') {
          if (p.read) candidateCaps.push({ key: 'property.list', enabled: true, scope: 'all' }, { key: 'property.view', enabled: true, scope: 'all' });
          if (p.create) candidateCaps.push({ key: 'property.create', enabled: true });
          if (p.update) candidateCaps.push({ key: 'property.edit', enabled: true, scope: 'all' });
          if (p.delete) candidateCaps.push({ key: 'property.archive', enabled: true });
        } else if (page === 'leads') {
          if (p.read) candidateCaps.push({ key: 'lead.list', enabled: true, scope: scopeVal }, { key: 'lead.view', enabled: true, scope: scopeVal });
          if (p.create) candidateCaps.push({ key: 'lead.create', enabled: true });
          if (p.update) candidateCaps.push({ key: 'lead.edit', enabled: true, scope: scopeVal });
          if (p.delete) candidateCaps.push({ key: 'lead.assign', enabled: true });
          if (p.send_whatsapp) candidateCaps.push({ key: 'lead.send_whatsapp', enabled: true });
          if (p.send_email) candidateCaps.push({ key: 'lead.send_email', enabled: true });
        } else if (page === 'customers') {
          if (p.read) candidateCaps.push({ key: 'customer.list', enabled: true, scope: scopeVal }, { key: 'customer.view', enabled: true, scope: scopeVal });
          if (p.create) candidateCaps.push({ key: 'customer.create', enabled: true });
          if (p.update) candidateCaps.push({ key: 'customer.edit', enabled: true, scope: scopeVal });
          if (p.delete) candidateCaps.push({ key: 'customer.archive', enabled: true });
        } else if (page === 'invoices') {
          if (p.read) candidateCaps.push({ key: 'invoice.list', enabled: true, scope: scopeVal }, { key: 'invoice.view', enabled: true, scope: scopeVal });
          if (p.download_pdf) candidateCaps.push({ key: 'invoice.download_pdf', enabled: true });
          if (p.send_email) candidateCaps.push({ key: 'invoice.send_email', enabled: true });
          if (p.send_whatsapp) candidateCaps.push({ key: 'invoice.send_whatsapp', enabled: true });
          if (p.create || p.update) candidateCaps.push({ key: 'invoice.record_payment', enabled: true });
          if (p.delete) candidateCaps.push({ key: 'invoice.void', enabled: true });
        } else if (page === 'cms') {
          if (p.read) candidateCaps.push({ key: 'cms.access', enabled: true });
          if (p.create || p.update) candidateCaps.push({ key: 'cms.edit', enabled: true });
          if (p.delete) candidateCaps.push({ key: 'cms.publish', enabled: true });
        } else if (page === 'templates') {
          if (p.read) candidateCaps.push({ key: 'template.access', enabled: true });
          if (p.create) candidateCaps.push({ key: 'template.create', enabled: true });
          if (p.update) candidateCaps.push({ key: 'template.edit', enabled: true });
          if (p.delete) candidateCaps.push({ key: 'template.publish', enabled: true });
        }
      }

      const { normalized } = validateAndNormalizeAssignments(candidateCaps);
      const beforeCaps = role.capabilities;
      role.capabilities = normalized;
      role.version = (role.version || 1) + 1;
      await role.save();
      invalidateRoleCache(role._id.toString());

      recordAuditEvent({
        actorRole: 'system',
        action: 'role.migrated',
        resourceType: 'role',
        resourceId: role._id.toString(),
        route: 'migration:migrateLegacyRoles',
        status: 200,
        changes: computeSafeDiff({ capabilities: beforeCaps }, { capabilities: normalized }),
        metadata: { roleName: role.name, capabilitiesCount: normalized.length },
      });

      report.migrated++;
    } else {
      report.ambiguous.push({
        roleId: role._id.toString(),
        name: role.name,
        reason: 'Role has no permissions array or unrecognized schema; preserved without automated changes.',
      });
    }
  }

  return report;
}
