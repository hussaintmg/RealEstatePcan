export interface ButtonVariantStyle {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cta';
  bg: string;
  color: string;
  border: string;
  hoverBg: string;
  hoverColor: string;
  shadow: string;
  radius: string;
  padding: string;
  fontWeight: string;
}

export interface CardVariantStyle {
  variant: 'flat' | 'bordered' | 'elevated' | 'glass' | 'neumorphic';
  bg: string;
  border: string;
  shadow: string;
  radius: string;
  padding: string;
}

export interface InputVariantStyle {
  variant: 'standard' | 'underline' | 'floating' | 'pill' | 'minimal';
  bg: string;
  border: string;
  focusBorder: string;
  radius: string;
  padding: string;
  fontSize: string;
}

export interface ComponentDesignConfig {
  buttons: Record<string, ButtonVariantStyle>;
  cards: Record<string, CardVariantStyle>;
  inputs: Record<string, InputVariantStyle>;
}

export const DEFAULT_COMPONENT_STYLES: ComponentDesignConfig = {
  buttons: {
    primary: {
      variant: 'primary',
      bg: 'var(--primary)',
      color: 'var(--primary-foreground)',
      border: 'none',
      hoverBg: 'var(--primary)',
      hoverColor: 'var(--primary-foreground)',
      shadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
      radius: 'var(--radius)',
      padding: '0.625rem 1.25rem',
      fontWeight: '600',
    },
    secondary: {
      variant: 'secondary',
      bg: 'var(--surface-2)',
      color: 'var(--foreground)',
      border: '1px solid var(--border)',
      hoverBg: 'var(--surface-3)',
      hoverColor: 'var(--foreground)',
      shadow: 'none',
      radius: 'var(--radius)',
      padding: '0.625rem 1.25rem',
      fontWeight: '500',
    },
    outline: {
      variant: 'outline',
      bg: 'transparent',
      color: 'var(--primary)',
      border: '1px solid var(--primary)',
      hoverBg: 'var(--primary)',
      hoverColor: 'var(--primary-foreground)',
      shadow: 'none',
      radius: 'var(--radius)',
      padding: '0.625rem 1.25rem',
      fontWeight: '500',
    },
    ghost: {
      variant: 'ghost',
      bg: 'transparent',
      color: 'var(--foreground)',
      border: 'none',
      hoverBg: 'var(--surface-2)',
      hoverColor: 'var(--foreground)',
      shadow: 'none',
      radius: 'var(--radius)',
      padding: '0.625rem 1rem',
      fontWeight: '500',
    },
    danger: {
      variant: 'danger',
      bg: 'var(--danger)',
      color: '#ffffff',
      border: 'none',
      hoverBg: '#dc2626',
      hoverColor: '#ffffff',
      shadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
      radius: 'var(--radius)',
      padding: '0.625rem 1.25rem',
      fontWeight: '600',
    },
    cta: {
      variant: 'cta',
      bg: 'var(--accent)',
      color: 'var(--accent-foreground)',
      border: 'none',
      hoverBg: 'var(--accent)',
      hoverColor: 'var(--accent-foreground)',
      shadow: '0 8px 25px -4px rgba(0, 0, 0, 0.4)',
      radius: 'var(--radius-full)',
      padding: '0.75rem 1.75rem',
      fontWeight: '700',
    },
  },
  cards: {
    flat: {
      variant: 'flat',
      bg: 'var(--surface-1)',
      border: 'none',
      shadow: 'none',
      radius: 'var(--radius-lg)',
      padding: '1.5rem',
    },
    bordered: {
      variant: 'bordered',
      bg: 'var(--surface-1)',
      border: '1px solid var(--border)',
      shadow: 'none',
      radius: 'var(--radius-lg)',
      padding: '1.5rem',
    },
    elevated: {
      variant: 'elevated',
      bg: 'var(--card)',
      border: '1px solid var(--border)',
      shadow: 'var(--shadow-preset)',
      radius: 'var(--radius-lg)',
      padding: '1.75rem',
    },
    glass: {
      variant: 'glass',
      bg: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid var(--border)',
      shadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      radius: 'var(--radius-lg)',
      padding: '1.75rem',
    },
    neumorphic: {
      variant: 'neumorphic',
      bg: 'var(--surface-1)',
      border: 'none',
      shadow: '6px 6px 16px rgba(0, 0, 0, 0.4), -6px -6px 16px rgba(255, 255, 255, 0.02)',
      radius: 'var(--radius-lg)',
      padding: '1.5rem',
    },
  },
  inputs: {
    standard: {
      variant: 'standard',
      bg: 'var(--surface-2)',
      border: '1px solid var(--border)',
      focusBorder: 'var(--focus)',
      radius: 'var(--radius)',
      padding: '0.625rem 1rem',
      fontSize: '0.875rem',
    },
    underline: {
      variant: 'underline',
      bg: 'transparent',
      border: 'none',
      focusBorder: 'var(--focus)',
      radius: '0px',
      padding: '0.625rem 0.25rem',
      fontSize: '0.875rem',
    },
    floating: {
      variant: 'floating',
      bg: 'var(--surface-1)',
      border: '1px solid var(--border)',
      focusBorder: 'var(--focus)',
      radius: 'var(--radius)',
      padding: '1rem 1rem 0.5rem 1rem',
      fontSize: '0.875rem',
    },
    pill: {
      variant: 'pill',
      bg: 'var(--surface-2)',
      border: '1px solid var(--border)',
      focusBorder: 'var(--focus)',
      radius: 'var(--radius-full)',
      padding: '0.625rem 1.25rem',
      fontSize: '0.875rem',
    },
    minimal: {
      variant: 'minimal',
      bg: 'transparent',
      border: '1px solid var(--border)',
      focusBorder: 'var(--focus)',
      radius: 'var(--radius-sm)',
      padding: '0.5rem 0.75rem',
      fontSize: '0.8125rem',
    },
  },
};
