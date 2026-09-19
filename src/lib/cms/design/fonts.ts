export interface FontDefinition {
  key: string;
  name: string;
  family: string;
  category: 'sans' | 'serif' | 'display' | 'mono';
  weights: number[];
  googleFontQuery?: string;
  fallback: string;
  description: string;
}

export const FONT_REGISTRY: FontDefinition[] = [
  // Modern Sans
  {
    key: 'inter',
    name: 'Inter',
    family: "'Inter', sans-serif",
    category: 'sans',
    weights: [400, 500, 600, 700],
    googleFontQuery: 'family=Inter:wght@400;500;600;700',
    fallback: 'system-ui, -apple-system, sans-serif',
    description: 'Highly legible clean neo-grotesque sans, ideal for modern real estate portals.',
  },
  {
    key: 'plus-jakarta-sans',
    name: 'Plus Jakarta Sans',
    family: "'Plus Jakarta Sans', sans-serif",
    category: 'sans',
    weights: [400, 500, 600, 700, 800],
    googleFontQuery: 'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
    fallback: 'system-ui, sans-serif',
    description: 'Contemporary geometric sans with warm luxury corporate appeal.',
  },
  {
    key: 'outfit',
    name: 'Outfit',
    family: "'Outfit', sans-serif",
    category: 'sans',
    weights: [300, 400, 500, 600, 700],
    googleFontQuery: 'family=Outfit:wght@300;400;500;600;700',
    fallback: 'sans-serif',
    description: 'Warm rounded geometric sans designed for hospitality and premium developments.',
  },
  {
    key: 'dm-sans',
    name: 'DM Sans',
    family: "'DM Sans', sans-serif",
    category: 'sans',
    weights: [400, 500, 700],
    googleFontQuery: 'family=DM+Sans:wght@400;500;700',
    fallback: 'sans-serif',
    description: 'Low-contrast geometric sans offering supreme editorial readability.',
  },
  {
    key: 'montserrat',
    name: 'Montserrat',
    family: "'Montserrat', sans-serif",
    category: 'sans',
    weights: [400, 500, 600, 700],
    googleFontQuery: 'family=Montserrat:wght@400;500;600;700',
    fallback: 'sans-serif',
    description: 'Iconic architectural urban geometric sans.',
  },

  // Luxury & Editorial Serif
  {
    key: 'cormorant-garamond',
    name: 'Cormorant Garamond',
    family: "'Cormorant Garamond', serif",
    category: 'serif',
    weights: [400, 500, 600, 700],
    googleFontQuery: 'family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400',
    fallback: 'Georgia, serif',
    description: 'Traditional royal French serif with ultra-fine curves for luxury penthouses.',
  },
  {
    key: 'playfair-display',
    name: 'Playfair Display',
    family: "'Playfair Display', serif",
    category: 'serif',
    weights: [400, 600, 700, 900],
    googleFontQuery: 'family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400',
    fallback: 'Didot, Georgia, serif',
    description: 'Transitional high-contrast serif exuding bespoke craftsmanship and prestige.',
  },
  {
    key: 'cinzel',
    name: 'Cinzel',
    family: "'Cinzel', serif",
    category: 'serif',
    weights: [500, 700, 900],
    googleFontQuery: 'family=Cinzel:wght@500;700;900',
    fallback: 'Trajan, serif',
    description: 'Roman inscriptional serif inspired by classical marble engravings.',
  },
  {
    key: 'newsreader',
    name: 'Newsreader',
    family: "'Newsreader', serif",
    category: 'serif',
    weights: [400, 500, 600],
    googleFontQuery: 'family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400',
    fallback: 'Georgia, serif',
    description: 'Refined editorial serif designed for deep reading and architectural essays.',
  },
  {
    key: 'bodoni-moda',
    name: 'Bodoni Moda',
    family: "'Bodoni Moda', serif",
    category: 'serif',
    weights: [400, 600, 800],
    googleFontQuery: 'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;0,6..96,800',
    fallback: 'Didot, serif',
    description: 'Ultra high-fashion Italian didone serif with dramatic thick-thin stroke contrast.',
  },

  // Geometric & Display
  {
    key: 'space-grotesk',
    name: 'Space Grotesk',
    family: "'Space Grotesk', sans-serif",
    category: 'display',
    weights: [500, 600, 700],
    googleFontQuery: 'family=Space+Grotesk:wght@500;600;700',
    fallback: 'monospace, sans-serif',
    description: 'Technical brutalist grotesque with mechanical details for modern architects.',
  },
  {
    key: 'syne',
    name: 'Syne',
    family: "'Syne', sans-serif",
    category: 'display',
    weights: [600, 700, 800],
    googleFontQuery: 'family=Syne:wght@600;700;800',
    fallback: 'sans-serif',
    description: 'Bold expressive display face made for luxury art galleries and signature towers.',
  },
  {
    key: 'archivo-black',
    name: 'Archivo Black',
    family: "'Archivo Black', sans-serif",
    category: 'display',
    weights: [900],
    googleFontQuery: 'family=Archivo+Black',
    fallback: 'Impact, sans-serif',
    description: 'Ultra-heavy headline face built for neo-brutalist statements.',
  },

  // Monospace
  {
    key: 'jetbrains-mono',
    name: 'JetBrains Mono',
    family: "'JetBrains Mono', monospace",
    category: 'mono',
    weights: [400, 500],
    googleFontQuery: 'family=JetBrains+Mono:wght@400;500',
    fallback: 'Courier New, monospace',
    description: 'Clean developer-grade monospaced font for unit matrices and floor metrics.',
  },
];

export function getFontByKey(key: string): FontDefinition {
  return FONT_REGISTRY.find((f) => f.key === key) || FONT_REGISTRY[0];
}

/**
 * Generates an optimized Google Fonts stylesheet URL loading ONLY the fonts requested
 * Avoids loading 30 font families simultaneously on public pages.
 */
export function buildGoogleFontsUrl(fontKeys: string[]): string {
  const uniqueKeys = Array.from(new Set(fontKeys.filter(Boolean)));
  const queries = uniqueKeys
    .map((k) => {
      const def = FONT_REGISTRY.find((f) => f.key === k);
      return def?.googleFontQuery;
    })
    .filter(Boolean);

  if (queries.length === 0) return '';
  return `https://fonts.googleapis.com/css2?${queries.join('&')}&display=swap`;
}
