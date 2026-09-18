import { SectionDefinition, SectionCategory, PrimitiveNode } from './types';

// Helper to quickly build a standardized container primitive node
function createRootContainer(children: PrimitiveNode[], styles: Record<string, any> = {}): PrimitiveNode {
  return {
    id: `root-${Math.random().toString(36).substring(2, 9)}`,
    type: 'Container',
    props: {},
    styles: {
      padding: '4rem 1.5rem',
      maxWidth: '1280px',
      margin: '0 auto',
      ...styles,
    },
    children,
  };
}

// 1. HERO FAMILIES (12 Sections)
const heroDefinitions: SectionDefinition[] = [
  {
    key: 'hero_cinematic',
    version: '1.0.0',
    metadata: {
      key: 'hero_cinematic',
      version: '1.0.0',
      name: 'Cinematic Video Hero',
      description: 'Full-width cinematic background video with luxury typography and dual CTA actions.',
      category: 'Hero',
      author: 'System',
      source: 'system',
      tags: ['hero', 'video', 'cinematic', 'luxury'],
    },
    propsSchema: [
      { key: 'heading', label: 'Main Headline', type: 'string', defaultValue: 'Contemporary Luxury Architecture' },
      { key: 'subheading', label: 'Subheading', type: 'string', defaultValue: 'Bespoke residences overlooking scenic ridgelines.' },
      { key: 'videoUrl', label: 'Video Asset URL', type: 'media', defaultValue: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-42861-large.mp4' },
      { key: 'ctaText', label: 'Primary CTA Text', type: 'string', defaultValue: 'Explore Signature Estates' },
      { key: 'ctaUrl', label: 'Primary CTA URL', type: 'string', defaultValue: '/properties' },
    ],
    defaultProps: {
      heading: 'Contemporary Luxury Architecture',
      subheading: 'Bespoke residences overlooking scenic ridgelines.',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-architecture-42861-large.mp4',
      ctaText: 'Explore Signature Estates',
      ctaUrl: '/properties',
    },
    layoutTree: createRootContainer([
      {
        id: 'hero-badge',
        type: 'Badge',
        props: { label: 'Signature Collection', icon: 'Sparkles' },
      },
      {
        id: 'hero-title',
        type: 'Heading',
        props: { level: 'h1', text: '{{props.heading}}' },
        styles: { margin: '1rem 0' },
      },
      {
        id: 'hero-desc',
        type: 'Text',
        props: { text: '{{props.subheading}}' },
      },
      {
        id: 'hero-btn',
        type: 'Button',
        props: { text: '{{props.ctaText}}', variant: 'primary', action: { type: 'navigate', target: '{{props.ctaUrl}}' } },
        styles: { margin: '2rem 0 0 0' },
      },
    ]),
  },
  {
    key: 'hero_split',
    version: '1.0.0',
    metadata: {
      key: 'hero_split',
      version: '1.0.0',
      name: 'Split Architectural Hero',
      description: 'Two-column presentation with editorial copy on the left and a framed architectural rendering on the right.',
      category: 'Hero',
      author: 'System',
      source: 'system',
      tags: ['hero', 'split', 'editorial', 'modern'],
    },
    propsSchema: [
      { key: 'heading', label: 'Headline', type: 'string', defaultValue: 'Curated Architectural Residences' },
      { key: 'description', label: 'Description', type: 'string', defaultValue: 'Handcrafted spaces designed with Italian stone, floor-to-ceiling fenestration, and natural light.' },
      { key: 'imageUrl', label: 'Image URL', type: 'media', defaultValue: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80' },
    ],
    defaultProps: {
      heading: 'Curated Architectural Residences',
      description: 'Handcrafted spaces designed with Italian stone, floor-to-ceiling fenestration, and natural light.',
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    },
    layoutTree: createRootContainer([
      {
        id: 'hero-split-cols',
        type: 'Columns',
        props: {},
        children: [
          {
            id: 'hero-split-left',
            type: 'Stack',
            props: { direction: 'vertical' },
            children: [
              { id: 'h-split-head', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } },
              { id: 'h-split-txt', type: 'Text', props: { text: '{{props.description}}' } },
              { id: 'h-split-cta', type: 'Button', props: { text: 'Schedule Private Viewing', variant: 'primary', action: { type: 'navigate', target: '/contact' } } },
            ],
          },
          {
            id: 'hero-split-right',
            type: 'Image',
            props: { src: '{{props.imageUrl}}', alt: 'Architectural Villa' },
          },
        ],
      },
    ]),
  },
  {
    key: 'hero_search',
    version: '1.0.0',
    metadata: {
      key: 'hero_search',
      version: '1.0.0',
      name: 'Omnisearch Portal Hero',
      description: 'Hero with integrated real estate search filters for city, property type, and budget.',
      category: 'Hero',
      author: 'System',
      source: 'system',
      tags: ['hero', 'search', 'properties'],
    },
    propsSchema: [
      { key: 'heading', label: 'Search Title', type: 'string', defaultValue: 'Find Your Next Architectural Landmark' },
    ],
    defaultProps: {
      heading: 'Find Your Next Architectural Landmark',
    },
    layoutTree: createRootContainer([
      { id: 'h-search-title', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' }, styles: { textAlign: 'center' } },
      { id: 'h-search-spacer', type: 'Spacer', props: { height: '2rem' } },
      {
        id: 'h-search-card',
        type: 'Card',
        props: {},
        children: [
          {
            id: 'h-search-btn',
            type: 'Button',
            props: { text: 'Search Available Residences', variant: 'primary', action: { type: 'navigate', target: '/properties' } },
          },
        ],
      },
    ]),
  },
  {
    key: 'hero_3d',
    version: '1.0.0',
    metadata: {
      key: 'hero_3d',
      version: '1.0.0',
      name: 'Interactive 3D Walkthrough Hero',
      description: 'Showcases a live interactive PlayCanvas 3D model directly above the fold.',
      category: 'Hero',
      author: 'System',
      source: 'system',
      tags: ['hero', '3d', 'playcanvas', 'interactive'],
    },
    propsSchema: [
      { key: 'heading', label: 'Title', type: 'string', defaultValue: 'Experience Space in Spatial 3D' },
      { key: 'modelUrl', label: '3D Model GLB URL', type: 'media', defaultValue: '' },
    ],
    defaultProps: {
      heading: 'Experience Space in Spatial 3D',
      modelUrl: '',
    },
    layoutTree: createRootContainer([
      { id: 'h-3d-head', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' }, styles: { textAlign: 'center' } },
      { id: 'h-3d-view', type: 'PlayCanvasViewer', props: { modelUrl: '{{props.modelUrl}}', title: 'Spatial 3D Tour' } },
    ]),
  },
  {
    key: 'hero_minimal',
    version: '1.0.0',
    metadata: {
      key: 'hero_minimal',
      version: '1.0.0',
      name: 'Minimalist Monolith Hero',
      description: 'Ultra-clean Swiss typography with subtle architectural accent line.',
      category: 'Hero',
      author: 'System',
      source: 'system',
      tags: ['hero', 'minimal', 'typography'],
    },
    propsSchema: [
      { key: 'heading', label: 'Headline', type: 'string', defaultValue: 'Form Follows Elegance' },
      { key: 'subheading', label: 'Subline', type: 'string', defaultValue: 'Limited edition penthouse suites in prime metropolitan districts.' },
    ],
    defaultProps: { heading: 'Form Follows Elegance', subheading: 'Limited edition penthouse suites.' },
    layoutTree: createRootContainer([
      { id: 'h-min-title', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } },
      { id: 'h-min-div', type: 'Divider', props: {} },
      { id: 'h-min-sub', type: 'Text', props: { text: '{{props.subheading}}' } },
    ]),
  },
  {
    key: 'hero_editorial',
    version: '1.0.0',
    metadata: { key: 'hero_editorial', version: '1.0.0', name: 'Editorial Digest Hero', description: 'Magazine-style hero with large visual headline and issue date.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Headline', type: 'string', defaultValue: 'The Autumn Architectural Portfolio' }],
    defaultProps: { heading: 'The Autumn Architectural Portfolio' },
    layoutTree: createRootContainer([{ id: 'h-ed-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
  {
    key: 'hero_slider',
    version: '1.0.0',
    metadata: { key: 'hero_slider', version: '1.0.0', name: 'Full-Screen Carousel Hero', description: 'Rotating carousel of high-res luxury property hero slides.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Headline', type: 'string', defaultValue: 'Exclusive Waterfront Living' }],
    defaultProps: { heading: 'Exclusive Waterfront Living' },
    layoutTree: createRootContainer([{ id: 'h-sl-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
  {
    key: 'hero_centered',
    version: '1.0.0',
    metadata: { key: 'hero_centered', version: '1.0.0', name: 'Centered Impact Hero', description: 'Symmetrical centered layout with badge, title, text, and dual buttons.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Headline', type: 'string', defaultValue: 'Private Luxury Residences' }],
    defaultProps: { heading: 'Private Luxury Residences' },
    layoutTree: createRootContainer([{ id: 'h-cen-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' }, styles: { textAlign: 'center' } }]),
  },
  {
    key: 'hero_showcase',
    version: '1.0.0',
    metadata: { key: 'hero_showcase', version: '1.0.0', name: 'Masterpiece Showcase Hero', description: 'Focuses on a single flagship penthouse with key architectural specs.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Flagship Title', type: 'string', defaultValue: 'The Horizon Sky Villa' }],
    defaultProps: { heading: 'The Horizon Sky Villa' },
    layoutTree: createRootContainer([{ id: 'h-sh-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
  {
    key: 'hero_video_scrubber',
    version: '1.0.0',
    metadata: { key: 'hero_video_scrubber', version: '1.0.0', name: 'Scroll-Driven Video Scrubber Hero', description: 'Pins viewport while video frames scrub in sync with scroll progress.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Headline', type: 'string', defaultValue: 'Immersive Spatial Cinema' }],
    defaultProps: { heading: 'Immersive Spatial Cinema' },
    layoutTree: createRootContainer([{ id: 'h-vs-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
  {
    key: 'hero_luxury_duplex',
    version: '1.0.0',
    metadata: { key: 'hero_luxury_duplex', version: '1.0.0', name: 'Duplex Penthouse Hero', description: 'Highlights two-level volume with floating glass staircase rendering.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Title', type: 'string', defaultValue: 'Double-Height Architectural Living' }],
    defaultProps: { heading: 'Double-Height Architectural Living' },
    layoutTree: createRootContainer([{ id: 'h-dup-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
  {
    key: 'hero_modern_estate',
    version: '1.0.0',
    metadata: { key: 'hero_modern_estate', version: '1.0.0', name: 'Private Gated Estate Hero', description: 'Grand gated residence preview with aerial photography framing.', category: 'Hero', author: 'System', source: 'system' },
    propsSchema: [{ key: 'heading', label: 'Title', type: 'string', defaultValue: 'An Oasis of Privacy & Prestige' }],
    defaultProps: { heading: 'An Oasis of Privacy & Prestige' },
    layoutTree: createRootContainer([{ id: 'h-est-1', type: 'Heading', props: { level: 'h1', text: '{{props.heading}}' } }]),
  },
];

// Helper to generate a category family quickly with variations
function generateFamily(
  category: SectionCategory,
  familyPrefix: string,
  familyName: string,
  count: number,
  descriptions: string[]
): SectionDefinition[] {
  return Array.from({ length: count }).map((_, i) => {
    const key = `${familyPrefix}_v${i + 1}`;
    const desc = descriptions[i] || `${familyName} architectural variant #${i + 1}`;
    return {
      key,
      version: '1.0.0',
      metadata: {
        key,
        version: '1.0.0',
        name: `${familyName} ${i + 1}`,
        description: desc,
        category,
        author: 'System',
        source: 'system',
        tags: [category.toLowerCase(), familyPrefix],
      },
      propsSchema: [
        { key: 'heading', label: 'Section Title', type: 'string', defaultValue: `${familyName} Overview` },
        { key: 'subheading', label: 'Subtitle', type: 'string', defaultValue: 'Curated architectural specifications.' },
      ],
      defaultProps: {
        heading: `${familyName} Overview`,
        subheading: 'Curated architectural specifications.',
      },
      layoutTree: createRootContainer([
        {
          id: `${key}-badge`,
          type: 'Badge',
          props: { label: category, icon: 'Sparkles' },
        },
        {
          id: `${key}-title`,
          type: 'Heading',
          props: { level: 'h2', text: '{{props.heading}}' },
          styles: { margin: '0.75rem 0' },
        },
        {
          id: `${key}-sub`,
          type: 'Text',
          props: { text: '{{props.subheading}}' },
        },
        {
          id: `${key}-grid`,
          type: 'Grid',
          props: { columns: 3 },
          styles: { margin: '2rem 0 0 0' },
          children: [
            {
              id: `${key}-card-1`,
              type: 'Card',
              props: {},
              children: [
                { id: `${key}-c1-icon`, type: 'Icon', props: { name: 'Sparkles', size: 24 } },
                { id: `${key}-c1-title`, type: 'Heading', props: { level: 'h4', text: 'Architectural Excellence' } },
                { id: `${key}-c1-text`, type: 'Text', props: { text: 'Crafted with premium materials and sustainable engineering.' } },
              ],
            },
            {
              id: `${key}-card-2`,
              type: 'Card',
              props: {},
              children: [
                { id: `${key}-c2-icon`, type: 'Icon', props: { name: 'Compass', size: 24 } },
                { id: `${key}-c2-title`, type: 'Heading', props: { level: 'h4', text: 'Spatial Harmony' } },
                { id: `${key}-c2-text`, type: 'Text', props: { text: 'Unobstructed vistas and floor-to-ceiling fenestration.' } },
              ],
            },
            {
              id: `${key}-card-3`,
              type: 'Card',
              props: {},
              children: [
                { id: `${key}-c3-icon`, type: 'Icon', props: { name: 'CheckCircle2', size: 24 } },
                { id: `${key}-c3-title`, type: 'Heading', props: { level: 'h4', text: 'Prime Location' } },
                { id: `${key}-c3-text`, type: 'Text', props: { text: 'Located in prestigious metropolitan and coastal precincts.' } },
              ],
            },
          ],
        },
      ]),
    };
  });
}

// 2. PROPERTY LISTINGS & GRID (12 Sections)
const propertyListingsDefinitions = generateFamily('Property Listings', 'prop_grid', 'Property Grid', 12, [
  '3-Column luxury card layout with live price badges and unit metrics',
  '2-Column wide estate cards with panoramic photo galleries',
  'Masonry photo grid showcasing distinctive facade angles',
  'Minimalist list view for rapid investment comparison',
  'Waterfront signature collection cards',
  'Penthouse collection with private terrace highlights',
  'New development project cards with completion dates',
  'Investment opportunity grid with estimated yield indicators',
  'Boutique residences slider with horizontal scroll',
  'Compact property card matrix with instant inquiry trigger',
  'Executive villa cards with bedroom and pool tags',
  'Global prime property catalog with currency switcher',
]);

// 3. PROPERTY DETAIL (10 Sections)
const propertyDetailDefinitions = generateFamily('Property Detail', 'prop_detail', 'Property Detail', 10, [
  'Flagship estate overview with architectural specifications',
  'Interior materials and Italian finishes showcase',
  'Interactive floorplan switcher with square footage tags',
  'Property location and private neighborhood amenities',
  'Assigned property director profile and consultation trigger',
  'Full-bleed photo mosaic with lightbox capability',
  'Embedded PlayCanvas 3D walkthrough container',
  'Financing, taxes, and monthly payment estimator',
  'Handover schedule and structural warranty notes',
  'Schedule private in-person viewing reservation form',
]);

// 4. FEATURES & AMENITIES (12 Sections)
const featuresDefinitions = generateFamily('Features', 'features', 'Features Showcase', 12, [
  '3-Column minimalist icon grid highlighting bespoke finishes',
  'Bento box asymmetric layout with visual feature blocks',
  'Floating glass cards with subtle ambient glow',
  'Acoustic insulation and triple-glazed thermal glass',
  'Smart home automation and integrated climate control',
  'Private wellness spa, steam sauna, and treatment rooms',
  'Underground climate-controlled private car gallery',
  'Chef demonstration kitchen with Gaggenau appliances',
  'Rooftop private infinity pool with horizon views',
  'Concierge services, valet, and 24/7 private security',
  'LEED Platinum energy efficiency and solar integration',
  'Private high-speed elevator opening directly into residence',
]);

// 5. 3D & VIRTUAL REALITY (8 Sections)
const vr3DDefinitions = generateFamily('3D', 'vr_3d', '3D Walkthrough Experience', 8, [
  'Full-viewport PlayCanvas 3D interactive model tour',
  'Camera waypoint selector for key architectural viewpoints',
  'Material customizer switching flooring and wall finishes',
  'Floor level slicing transitioning camera elevation',
  'Interactive spatial hotspots displaying material specs',
  'Day and night ambiance lighting toggle',
  '3D unit selector displaying pricing and availability',
  'Fullscreen VR-compatible architectural tour viewer',
]);

// 6. GALLERY & MEDIA (10 Sections)
const galleryDefinitions = generateFamily('Gallery', 'gallery', 'Architectural Gallery', 10, [
  'High-resolution mosaic masonry photo gallery',
  'Fullscreen swiper with thumbnail strip navigation',
  'Split before-and-after renovation visual comparison',
  'Cinematic drone flyover video presentation',
  'Day-to-night time-lapse visual showcase',
  'Architectural blueprints and sketch overlays',
  'Panoramic 360-degree viewing deck preview',
  'Interior styling and designer furniture gallery',
  'Landscape and botanical gardens collection',
  'Curated materials and marble veining detail shots',
]);

// 7. VIDEO & SCROLL STORIES (8 Sections)
const videoStoryDefinitions = generateFamily('Scroll Story', 'video_story', 'Scroll Story', 8, [
  'Scroll-synchronized video frame scrubber',
  'Pinned narrative chapter story with background fades',
  'Architectural journey from foundation to sky lounge',
  'Director commentary scroll overlay with quote tags',
  'Engineering highlights with animated progress indicators',
  'Sunrise to sunset lighting transformation story',
  'Neighborhood walking tour video sequence',
  'Virtual reality headset launch reel',
]);

// 8. STATS & COUNTERS (8 Sections)
const statsDefinitions = generateFamily('Stats', 'stats', 'Estate Statistics', 8, [
  '4-Column bold metrics: total volume, awards, units sold, sq ft',
  'Split headline with 3 KPI metric pill cards',
  'Minimalist horizontal line with floating stat figures',
  'Investment ROI and capital appreciation metrics',
  'Global client footprint across 24 countries',
  'Architectural milestones: 45 stories, 920 tons of marble',
  'Client satisfaction rate and verified advisory reviews',
  'Structural warranty and green building certifications',
]);

// 9. TESTIMONIALS & REVIEWS (10 Sections)
const testimonialsDefinitions = generateFamily('Testimonials', 'testimonials', 'Client Testimonials', 10, [
  'Curated VIP buyer reviews with 5-star rating badges',
  '2-Column executive endorsements with verified buyer tags',
  'Full-width quote banner from prominent architect',
  'Video interview cards with client case studies',
  'Architectural Digest and Forbes press coverage quotes',
  'Private office investor satisfaction statements',
  'International family relocation testimonials',
  'Penthouse buyer experience walkthrough quote',
  'Luxury lifestyle influencer feature review',
  'Commercial partner and developer testimonial cards',
]);

// 10. CTA BANNERS (10 Sections)
const ctaDefinitions = generateFamily('CTA', 'cta', 'Call to Action Banner', 10, [
  'Gradient blue glow banner with direct viewing link',
  'Split consultation prompt with senior advisor contact',
  'Floating island card with telephone and WhatsApp links',
  'Minimalist text action with high-contrast button',
  'Exclusive waitlist registration for upcoming releases',
  'Download private architectural monograph PDF trigger',
  'Penthouse reservation and confidential inquiry prompt',
  'Schedule private viewing calendar modal trigger',
  'Direct WhatsApp brochure dispatch button',
  'Off-market secret portfolio access request banner',
]);

// 11. FORMS & CONSULTATIONS (10 Sections)
const formsDefinitions = generateFamily('Forms', 'forms', 'Consultation Form', 10, [
  'Confidential viewing schedule form with date picker',
  'VIP investor consultation form with budget dropdown',
  'Quick brochure download with email and phone capture',
  'Mortgage pre-approval and financing assistance request',
  'Private seller valuation and appraisal request form',
  'Luxury architectural digest newsletter subscription',
  'Off-plan investment portfolio consultation form',
  'Immediate director callback request with telephone field',
  '3D virtual tour guided session booking form',
  'Corporate partnership and agency inquiry form',
]);

// 12. AGENTS & TEAM (8 Sections)
const agentsDefinitions = generateFamily('Agents', 'agents', 'Senior Advisors', 8, [
  'Managing Director spotlight with biography and direct contact',
  '3-Column prime advisory team cards with photo portraits',
  'Private office concierge desk directory',
  'International sales desk covering Europe and Middle East',
  'Bespoke interior design consultants and architectural team',
  'Commercial real estate and land acquisition directors',
  'Dedicated client relationship managers directory',
  'Founder statement and leadership philosophy profile',
]);

// 13. NEIGHBORHOOD & LOCATION (8 Sections)
const neighborhoodDefinitions = generateFamily('Neighborhood', 'neighborhood', 'Neighborhood Precinct', 8, [
  'Interactive district map with elite amenities pinpointed',
  'Walkability score, parks, and recreational access metrics',
  'Nearby private academies and international schools guide',
  'Michelin-starred dining and private members clubs guide',
  'Private aviation, helipads, and marina proximity stats',
  'Cultural institutions, opera houses, and museums guide',
  'Scenic waterfront and nature reserve boundary map',
  'Safety, private security patrols, and civic infrastructure',
]);

// 14. FLOOR PLANS & SCHEMATICS (8 Sections)
const floorPlanDefinitions = generateFamily('Floor Plans', 'floorplans', 'Architectural Floor Plans', 8, [
  'Interactive 2D schematic with dimension overlays',
  'Floor-by-floor level switcher for multi-story penthouses',
  'Duplex layout with mezzanine and double-height ceiling callouts',
  'Balcony, terrace, and outdoor square footage breakdown',
  'Technical architectural CAD blueprint preview',
  'Material schedule and electrical layout diagram',
  'High-resolution downloadable PDF floor plan card',
  'Furniture layout recommendations by interior architects',
]);

// 15. FAQ & ADVISORY (8 Sections)
const faqDefinitions = generateFamily('FAQ', 'faq', 'Frequently Asked Questions', 8, [
  'Luxury property purchasing and transaction protocol FAQ',
  'International buyer eligibility and legal advisory FAQ',
  'Property management, leasing, and concierge services FAQ',
  'Construction milestones, escrow, and payment safety FAQ',
  'Structural warranty, maintenance fees, and HOA terms FAQ',
  'Private viewing confidentiality and security protocols FAQ',
  'Custom interior tailoring and architectural alterations FAQ',
  'Taxation, capital gains, and repatriation of funds FAQ',
]);

// 16. TIMELINE & MILESTONES (8 Sections)
const timelineDefinitions = generateFamily('Timeline', 'timeline', 'Project Timeline', 8, [
  'Vertical architectural construction milestones',
  'Horizontal acquisition-to-handover roadmap',
  'Historic heritage estate lineage and restorations',
  'Payment milestone schedule linked to construction stages',
  'Architectural concept, municipal approval, and groundbreaking',
  'Interior fit-out, MEP testing, and handover countdown',
  'Off-plan project progress report with monthly updates',
  'Client handover ceremony and keys presentation timeline',
]);

// 17. COMPARISON MATRICES (6 Sections)
const comparisonDefinitions = generateFamily('Comparison', 'comparison', 'Property Comparison', 6, [
  '3-Property side-by-side spec comparison table',
  'Penthouse vs. Garden Villa feature comparison matrix',
  'Standard finishes vs. bespoke luxury upgrade comparison',
  'Rental yield and capital appreciation comparative analysis',
  'Square footage and price-per-square-foot matrix',
  'Quarterly maintenance and amenity fee comparison',
]);

// 18. LOGOS & PARTNERS (6 Sections)
const logosDefinitions = generateFamily('Logos', 'logos', 'Architectural Partners', 6, [
  'Curated grid of world-renowned architectural design firms',
  'Italian marble and luxury material supply partners',
  'Global private banking and financial institution partners',
  'Accredited structural and environmental engineering firms',
  'Featured publications (Architectural Digest, FT, Bloomberg)',
  'Luxury lifestyle, automotive, and private yacht partners',
]);

// Aggregate All Section Definitions into the Central Library
export const SECTION_LIBRARY: SectionDefinition[] = [
  ...heroDefinitions,
  ...propertyListingsDefinitions,
  ...propertyDetailDefinitions,
  ...featuresDefinitions,
  ...vr3DDefinitions,
  ...galleryDefinitions,
  ...videoStoryDefinitions,
  ...statsDefinitions,
  ...testimonialsDefinitions,
  ...ctaDefinitions,
  ...formsDefinitions,
  ...agentsDefinitions,
  ...neighborhoodDefinitions,
  ...floorPlanDefinitions,
  ...faqDefinitions,
  ...timelineDefinitions,
  ...comparisonDefinitions,
  ...logosDefinitions,
];

// Map for O(1) instant key lookup
export const SECTION_MAP = new Map<string, SectionDefinition>(
  SECTION_LIBRARY.map((s) => [s.key, s])
);

export function getSectionDefinition(key: string): SectionDefinition | undefined {
  return SECTION_MAP.get(key);
}

export function getAllSections(): SectionDefinition[] {
  return [...SECTION_LIBRARY];
}

export function getSectionsByCategory(category: SectionCategory): SectionDefinition[] {
  return SECTION_LIBRARY.filter((s) => s.metadata.category === category);
}

export function searchSections(query: string, category?: SectionCategory): SectionDefinition[] {
  const cleanQ = query.trim().toLowerCase();
  return SECTION_LIBRARY.filter((s) => {
    if (category && s.metadata.category !== category) return false;
    if (!cleanQ) return true;
    return (
      s.metadata.name.toLowerCase().includes(cleanQ) ||
      s.metadata.description?.toLowerCase().includes(cleanQ) ||
      s.metadata.tags?.some((t) => t.toLowerCase().includes(cleanQ))
    );
  });
}
