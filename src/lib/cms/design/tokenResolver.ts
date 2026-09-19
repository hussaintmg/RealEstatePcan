import { ThemeTokens, DEFAULT_DESIGN_TOKENS, ThemeDefinition } from './tokens';
import { getThemeByKey } from './themes';

export interface TokenOverrideInput {
  colors?: Partial<ThemeTokens['colors']>;
  metrics?: Partial<ThemeTokens['metrics']>;
  typography?: Partial<ThemeTokens['typography']>;
  motion?: Partial<ThemeTokens['motion']>;
}

/**
 * Resolves full design tokens using the strict precedence:
 * System Defaults -> Theme -> Template Defaults -> Owner Customization Overrides
 */
export function resolveDesignTokens(
  themeKey?: string,
  overrides?: TokenOverrideInput,
  templateDefaults?: Partial<ThemeTokens>
): ThemeTokens {
  const baseTheme: ThemeDefinition = getThemeByKey(themeKey || 'luxury-dark');

  const resolved: ThemeTokens = {
    colors: {
      ...DEFAULT_DESIGN_TOKENS.colors,
      ...baseTheme.tokens.colors,
      ...(templateDefaults?.colors || {}),
      ...(overrides?.colors || {}),
    },
    metrics: {
      ...DEFAULT_DESIGN_TOKENS.metrics,
      ...baseTheme.tokens.metrics,
      ...(templateDefaults?.metrics || {}),
      ...(overrides?.metrics || {}),
    },
    typography: {
      ...DEFAULT_DESIGN_TOKENS.typography,
      ...baseTheme.tokens.typography,
      ...(templateDefaults?.typography || {}),
      ...(overrides?.typography || {}),
    },
    motion: {
      ...DEFAULT_DESIGN_TOKENS.motion,
      ...baseTheme.tokens.motion,
      ...(templateDefaults?.motion || {}),
      ...(overrides?.motion || {}),
    },
  };

  return resolved;
}

/**
 * Sanitizes a CSS variable value to prevent CSS injection attacks (e.g. closing braces, imports)
 */
export function sanitizeCssValue(value: string | undefined): string {
  if (!value) return '';
  return String(value)
    .replace(/[;{}]/g, '')
    .replace(/expression\s*\(/gi, '')
    .replace(/javascript\s*:/gi, '')
    .trim();
}

/**
 * Converts resolved ThemeTokens into standard CSS custom properties
 */
export function tokensToCssVariables(tokens: ThemeTokens): Record<string, string> {
  const c = tokens.colors;
  const m = tokens.metrics;
  const t = tokens.typography;

  return {
    '--background': sanitizeCssValue(c.background),
    '--foreground': sanitizeCssValue(c.foreground),
    '--surface-1': sanitizeCssValue(c.surface1),
    '--surface-2': sanitizeCssValue(c.surface2),
    '--surface-3': sanitizeCssValue(c.surface3),
    '--card': sanitizeCssValue(c.card),
    '--card-foreground': sanitizeCssValue(c.cardForeground),
    '--primary': sanitizeCssValue(c.primary),
    '--primary-foreground': sanitizeCssValue(c.primaryForeground),
    '--secondary': sanitizeCssValue(c.secondary),
    '--secondary-foreground': sanitizeCssValue(c.secondaryForeground),
    '--accent': sanitizeCssValue(c.accent),
    '--accent-foreground': sanitizeCssValue(c.accentForeground),
    '--muted': sanitizeCssValue(c.muted),
    '--muted-foreground': sanitizeCssValue(c.mutedForeground),
    '--border': sanitizeCssValue(c.border),
    '--focus': sanitizeCssValue(c.focus),
    '--success': sanitizeCssValue(c.success),
    '--warning': sanitizeCssValue(c.warning),
    '--danger': sanitizeCssValue(c.danger),

    '--radius-sm': sanitizeCssValue(m.radiusSm),
    '--radius': sanitizeCssValue(m.radiusMd),
    '--radius-lg': sanitizeCssValue(m.radiusLg),
    '--radius-full': sanitizeCssValue(m.radiusFull),
    '--shadow-preset': sanitizeCssValue(m.shadowValue || 'none'),
    '--container-max-width': sanitizeCssValue(m.containerMaxWidth),
    '--spacing-scale': sanitizeCssValue(m.spacingScale),

    '--font-heading': sanitizeCssValue(t.headingFont),
    '--font-body': sanitizeCssValue(t.bodyFont),
    '--font-ui': sanitizeCssValue(t.uiFont),
    '--heading-weight': sanitizeCssValue(t.headingWeight || '700'),
    '--body-weight': sanitizeCssValue(t.bodyWeight || '400'),
  };
}

/**
 * Formats CSS custom properties into a raw inline style tag or stylesheet string
 */
export function tokensToCssString(tokens: ThemeTokens, selector: string = ':root'): string {
  const vars = tokensToCssVariables(tokens);
  const rules = Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');
  return `${selector} {\n${rules}\n}`;
}
