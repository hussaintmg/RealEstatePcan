import { runLegacySetupMigration } from './migration';

export async function ensureDeveloperBootstrap() {
  // Check migration status safely
  const result = await runLegacySetupMigration();

  // Seed CMS Default Theme, Layouts, and Pages
  try {
    const { ensureCmsSeeded } = await import('./cms/seedCmsDefaults');
    await ensureCmsSeeded();
  } catch (err) {
    console.warn('CMS seeding warning:', err);
  }

  return result;
}
