export interface ColorTokens {
  background: string;
  foreground: string;
  surface1: string;
  surface2: string;
  surface3: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  focus: string;
  success: string;
  warning: string;
  danger: string;
}

export interface MetricTokens {
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusFull: string;
  shadowPreset: 'none' | 'soft' | 'medium' | 'floating' | 'dramatic';
  shadowValue?: string;
  containerMaxWidth: string;
  spacingScale: string;
}

export interface TypographyTokens {
  headingFont: string;
  bodyFont: string;
  uiFont: string;
  accentFont?: string;
  headingWeight?: string;
  bodyWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
}

export interface MotionTokens {
  transitionFast: string;
  transitionNormal: string;
  transitionSlow: string;
  reducedMotion: boolean;
}

export interface ThemeTokens {
  colors: ColorTokens;
  metrics: MetricTokens;
  typography: TypographyTokens;
  motion: MotionTokens;
}

export interface ThemeDefinition {
  key: string;
  name: string;
  category:
    | 'Luxury'
    | 'Architectural'
    | 'Editorial'
    | 'Minimal'
    | 'Modern'
    | 'Warm'
    | 'Corporate'
    | 'Artistic'
    | 'High-Tech';
  description: string;
  mode: 'dark' | 'light' | 'dual';
  tokens: ThemeTokens;
  darkTokens?: Partial<ThemeTokens>;
  lightTokens?: Partial<ThemeTokens>;
  componentDefaults?: {
    buttonRadius?: string;
    cardBorder?: string;
    navbarStyle?: 'transparent' | 'solid' | 'glass';
  };
}

export const DEFAULT_DESIGN_TOKENS: ThemeTokens = {
  colors: {
    background: '#0a0d14',
    foreground: '#f8fafc',
    surface1: '#111726',
    surface2: '#1a2236',
    surface3: '#242f49',
    card: '#111726',
    cardForeground: '#f8fafc',
    primary: '#3b82f6',
    primaryForeground: '#ffffff',
    secondary: '#6366f1',
    secondaryForeground: '#ffffff',
    accent: '#10b981',
    accentForeground: '#ffffff',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    border: 'rgba(255, 255, 255, 0.1)',
    focus: '#60a5fa',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  },
  metrics: {
    radiusSm: '0.375rem',
    radiusMd: '0.5rem',
    radiusLg: '0.75rem',
    radiusFull: '9999px',
    shadowPreset: 'medium',
    shadowValue: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
    containerMaxWidth: '1280px',
    spacingScale: '1rem',
  },
  typography: {
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
    uiFont: 'Inter, sans-serif',
    headingWeight: '700',
    bodyWeight: '400',
    letterSpacing: '-0.02em',
    lineHeight: '1.5',
  },
  motion: {
    transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionNormal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    transitionSlow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
    reducedMotion: false,
  },
};
