import { FONT_REGISTRY, FontDefinition } from './fonts';

export interface FontPairing {
  id: string;
  name: string;
  category: string;
  description: string;
  headingFont: string;
  bodyFont: string;
  uiFont: string;
  accentFont?: string;
  letterSpacing: string;
  lineHeight: string;
  headingWeight: string;
  bodyWeight: string;
}

export const CURATED_FONT_PAIRINGS: FontPairing[] = [
  {
    id: 'luxury-editorial',
    name: 'Luxury Editorial',
    category: 'Luxury',
    description: 'Cormorant Garamond headers paired with crisp Inter body for high-end residential towers.',
    headingFont: "'Cormorant Garamond', serif",
    bodyFont: "'Inter', sans-serif",
    uiFont: "'Inter', sans-serif",
    headingWeight: '600',
    bodyWeight: '400',
    letterSpacing: '0.02em',
    lineHeight: '1.6',
  },
  {
    id: 'modern-architecture',
    name: 'Modern Architecture',
    category: 'Architectural',
    description: 'Technical Space Grotesk headings with Plus Jakarta Sans body for modern design studios.',
    headingFont: "'Space Grotesk', sans-serif",
    bodyFont: "'Plus Jakarta Sans', sans-serif",
    uiFont: "'Space Grotesk', sans-serif",
    headingWeight: '700',
    bodyWeight: '400',
    letterSpacing: '-0.02em',
    lineHeight: '1.5',
  },
  {
    id: 'minimal-property',
    name: 'Minimal Property',
    category: 'Minimal',
    description: 'Warm Outfit geometric headings with DM Sans for contemporary living projects.',
    headingFont: "'Outfit', sans-serif",
    bodyFont: "'DM Sans', sans-serif",
    uiFont: "'DM Sans', sans-serif",
    headingWeight: '600',
    bodyWeight: '400',
    letterSpacing: '-0.01em',
    lineHeight: '1.55',
  },
  {
    id: 'corporate-premium',
    name: 'Corporate Premium',
    category: 'Corporate',
    description: 'Authoritative Plus Jakarta Sans with Inter for institutional commercial developments.',
    headingFont: "'Plus Jakarta Sans', sans-serif",
    bodyFont: "'Inter', sans-serif",
    uiFont: "'Inter', sans-serif",
    headingWeight: '700',
    bodyWeight: '400',
    letterSpacing: '-0.02em',
    lineHeight: '1.5',
  },
  {
    id: 'classic-luxury',
    name: 'Classic Luxury',
    category: 'Luxury',
    description: 'Playfair Display headers with Montserrat for grand traditional estates and châteaux.',
    headingFont: "'Playfair Display', serif",
    bodyFont: "'Montserrat', sans-serif",
    uiFont: "'Montserrat', sans-serif",
    headingWeight: '700',
    bodyWeight: '400',
    letterSpacing: '0.01em',
    lineHeight: '1.6',
  },
  {
    id: 'high-fashion',
    name: 'High Fashion',
    category: 'Editorial',
    description: 'Sculptural Syne bold headings with clean Inter body for ultra-luxury penthouses.',
    headingFont: "'Syne', sans-serif",
    bodyFont: "'Inter', sans-serif",
    uiFont: "'Inter', sans-serif",
    headingWeight: '800',
    bodyWeight: '400',
    letterSpacing: '-0.03em',
    lineHeight: '1.45',
  },
];

export interface FluidTypeScale {
  display: string;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  body: string;
  caption: string;
}

/**
 * Calculates responsive clamp(...) values scaling fluidly from mobile viewport (375px) to desktop (1440px)
 */
export function calculateFluidTypeScale(factor: number = 1.0): FluidTypeScale {
  const f = Math.max(0.75, Math.min(factor, 1.4));

  return {
    display: `clamp(${2.5 * f}rem, 5vw + ${1.5 * f}rem, ${4.75 * f}rem)`,
    h1: `clamp(${2.0 * f}rem, 4vw + ${1.25 * f}rem, ${3.5 * f}rem)`,
    h2: `clamp(${1.5 * f}rem, 3vw + ${1.0 * f}rem, ${2.5 * f}rem)`,
    h3: `clamp(${1.25 * f}rem, 2vw + ${0.875 * f}rem, ${1.875 * f}rem)`,
    h4: `clamp(${1.125 * f}rem, 1.5vw + ${0.75 * f}rem, ${1.5 * f}rem)`,
    body: `clamp(${0.9375 * f}rem, 0.5vw + ${0.875 * f}rem, ${1.125 * f}rem)`,
    caption: `clamp(${0.75 * f}rem, 0.25vw + ${0.75 * f}rem, ${0.875 * f}rem)`,
  };
}
