import { CmsPage } from '../../models/CmsPage';
import { CmsLayout } from '../../models/CmsLayout';
import { CmsTheme } from '../../models/CmsTheme';
import { CmsAsset } from '../../models/CmsAsset';
import { discoverModelVariables } from './modelDiscovery';

export interface IntegrityIssue {
  id: string;
  type: 'broken_link' | 'missing_layout' | 'unknown_variable' | 'missing_asset';
  severity: 'high' | 'medium' | 'low';
  location: string;
  message: string;
  suggestedAction: string;
}

export async function runBrokenReferenceCheck(): Promise<{
  totalIssues: number;
  issues: IntegrityIssue[];
}> {
  const issues: IntegrityIssue[] = [];

  const [pages, layouts, theme, assets] = await Promise.all([
    CmsPage.find({}).lean(),
    CmsLayout.find({}).lean(),
    CmsTheme.findOne({ isDefault: true }).lean(),
    CmsAsset.find({}).lean(),
  ]);

  const pageSlugs = new Set(pages.map((p) => p.slug));
  const layoutIds = new Set(layouts.map((l) => String(l._id)));
  const knownVariables = new Set(discoverModelVariables().map((v) => v.key));
  const knownAssetUrls = new Set(assets.map((a) => a.url));

  // 1. Check Layout Menus for Broken Page Links
  for (const layout of layouts) {
    const menuItems = layout.content?.menuItems || [];
    for (const item of menuItems) {
      if (item.url && item.url.startsWith('/') && !item.url.startsWith('/#') && !item.url.startsWith('/api')) {
        const slug = item.url.replace(/^\//, '').split('?')[0];
        if (slug && !pageSlugs.has(slug) && slug !== 'properties' && slug !== 'login' && slug !== 'portal') {
          issues.push({
            id: `link-${layout._id}-${item.id}`,
            type: 'broken_link',
            severity: 'medium',
            location: `Layout: ${layout.title} -> Menu Item "${item.label}"`,
            message: `Menu link points to "${item.url}", but no CMS page with slug "${slug}" exists.`,
            suggestedAction: `Create a page with slug "${slug}" or update the menu URL.`,
          });
        }
      }
    }
  }

  // 2. Check Pages for Missing Layout References
  for (const page of pages) {
    if (page.layout?.navbarId && !layoutIds.has(String(page.layout.navbarId))) {
      issues.push({
        id: `layout-${page._id}-navbar`,
        type: 'missing_layout',
        severity: 'high',
        location: `Page: ${page.title} (${page.slug})`,
        message: `Page specifies a custom Navbar layout ID that does not exist in the database.`,
        suggestedAction: `Reset navbar layout to "Default" or select an active layout.`,
      });
    }
    if (page.layout?.footerId && !layoutIds.has(String(page.layout.footerId))) {
      issues.push({
        id: `layout-${page._id}-footer`,
        type: 'missing_layout',
        severity: 'high',
        location: `Page: ${page.title} (${page.slug})`,
        message: `Page specifies a custom Footer layout ID that does not exist in the database.`,
        suggestedAction: `Reset footer layout to "Default" or select an active layout.`,
      });
    }

    // 3. Check for Unknown Variables inside Page Sections
    for (const sec of page.sections || []) {
      const contentStr = JSON.stringify(sec.content || {});
      const varMatches = contentStr.match(/\{\{([\w\.]+)\}\}/g) || [];
      for (const match of varMatches) {
        const cleanVar = match.replace(/[\{\}]/g, '');
        if (cleanVar !== 'this' && cleanVar !== '@index' && !knownVariables.has(cleanVar) && !cleanVar.startsWith('this.')) {
          issues.push({
            id: `var-${page._id}-${sec.id}-${cleanVar}`,
            type: 'unknown_variable',
            severity: 'low',
            location: `Page: ${page.title} -> Section "${sec.title}"`,
            message: `Unrecognized variable "${match}" detected.`,
            suggestedAction: `Verify model property or add custom variable in Variable Manager.`,
          });
        }
      }
    }
  }

  return {
    totalIssues: issues.length,
    issues,
  };
}
