export interface BlockPropertyField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'image' | 'url' | 'select' | 'boolean' | 'color' | 'icon';
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  variableCompatible?: boolean;
  helpText?: string;
}

export interface CmsBlockDefinition {
  type: string;
  title: string;
  category: 'Hero' | '3D & Media' | 'Portfolios & Grids' | 'Forms & Conversion' | 'Content & Text' | 'Social Proof';
  description: string;
  defaultContent: Record<string, any>;
  fields: BlockPropertyField[];
}

export const BLOCK_REGISTRY: Record<string, CmsBlockDefinition> = {
  hero_video: {
    type: 'hero_video',
    title: 'Hero Video Scrubber',
    category: 'Hero',
    description: 'Apple-style cinematic video scrubber with scroll-driven text storytelling overlays',
    defaultContent: {
      badge: 'EXCLUSIVE LIVING',
      heading: 'Contemporary Luxury Architecture',
      subheading: 'Immerse yourself in bespoke residences overlooking scenic ridgelines.',
      ctaText: 'View Estates',
      ctaUrl: '/properties',
      secondaryCtaText: '3D Virtual Tours',
      secondaryCtaUrl: '/#virtual-tour',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
    },
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text', variableCompatible: true },
      { key: 'heading', label: 'Main Headline', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Sub-headline / Paragraph', type: 'textarea', variableCompatible: true },
      { key: 'ctaText', label: 'Primary CTA Text', type: 'text', variableCompatible: true },
      { key: 'ctaUrl', label: 'Primary CTA URL', type: 'url', variableCompatible: true },
      { key: 'secondaryCtaText', label: 'Secondary CTA Text', type: 'text', variableCompatible: true },
      { key: 'secondaryCtaUrl', label: 'Secondary CTA URL', type: 'url', variableCompatible: true },
      { key: 'videoUrl', label: 'Background Video MP4 URL', type: 'url', variableCompatible: true },
    ],
  },

  playcanvas_tour: {
    type: 'playcanvas_tour',
    title: '3D PlayCanvas Virtual Tour',
    category: '3D & Media',
    description: 'Interactive WebGL 3D architectural viewer with cinematic auto-tour and material customizer',
    defaultContent: {
      badge: 'WEBGL 3D SHOWCASE',
      heading: 'Interactive Architectural Walkthrough',
      subheading: 'Inspect fine materials, switch between floorplans, and fly through suites.',
      modelUrl: '',
    },
    fields: [
      { key: 'badge', label: 'Badge Label', type: 'text', variableCompatible: true },
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
      { key: 'modelUrl', label: '3D GLB Model URL', type: 'url', variableCompatible: true },
    ],
  },

  features_grid: {
    type: 'features_grid',
    title: 'Features & Amenities Grid',
    category: 'Content & Text',
    description: 'Multi-column cards highlighting key features, smart amenities, or broker assurances',
    defaultContent: {
      heading: 'Engineered For Ultra-High-Net-Worth Living',
      subheading: 'Every estate integrates state-of-the-art automation and structural resilience.',
      items: [
        { title: 'Interactive 3D Walkthroughs', desc: 'Inspect structural layouts and finishes with zero rendering delay.', icon: 'Compass' },
        { title: 'Margalla Hillside Panoramas', desc: 'Floor-to-ceiling panoramic thermal glass overlooking natural foliage.', icon: 'Sparkles' },
        { title: 'Bank-Grade Title Deeds', desc: '100% government-verified clear titles and escrow protection.', icon: 'ShieldCheck' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Section Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Section Subheading', type: 'textarea', variableCompatible: true },
    ],
  },

  properties_grid: {
    type: 'properties_grid',
    title: 'Curated Properties Portfolio',
    category: 'Portfolios & Grids',
    description: 'Dynamic grid displaying real estate listings with price, specs, and comparison badges',
    defaultContent: {
      heading: 'Signature Architectural Estates',
      subheading: 'Handpicked selection of premier villas, hillside penthouses, and private compounds.',
      limit: 6,
      filterType: '',
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
      { key: 'limit', label: 'Properties to Display', type: 'number' },
      {
        key: 'filterType',
        label: 'Filter Property Type',
        type: 'select',
        options: [
          { label: 'All Property Types', value: '' },
          { label: 'Villas', value: 'Villa' },
          { label: 'Penthouses', value: 'Penthouse' },
          { label: 'Apartments', value: 'Apartment' },
        ],
      },
    ],
  },

  mortgage_calc: {
    type: 'mortgage_calc',
    title: 'Mortgage & Financing Calculator',
    category: 'Forms & Conversion',
    description: 'Client-facing mortgage calculation widget with principal, interest, tax, and insurance breakdown',
    defaultContent: {
      heading: 'Investment & Financing Estimation',
      subheading: 'Calculate monthly obligations, tax assessments, and bespoke private financing terms.',
      defaultPrice: 1850000,
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
      { key: 'defaultPrice', label: 'Default Home Price ($)', type: 'number', variableCompatible: true },
    ],
  },

  lead_form: {
    type: 'lead_form',
    title: 'VIP Private Advisory Consultation',
    category: 'Forms & Conversion',
    description: 'High-converting private viewing and advisory registration form with instant lead capture',
    defaultContent: {
      heading: 'Schedule a Confidential Private Viewing',
      subheading: 'Our Senior Property Directors provide direct advisory for high-net-worth investors.',
      badge: 'PRIVATE DESK',
    },
    fields: [
      { key: 'badge', label: 'Badge', type: 'text', variableCompatible: true },
      { key: 'heading', label: 'Headline', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Description', type: 'textarea', variableCompatible: true },
    ],
  },

  testimonials: {
    type: 'testimonials',
    title: 'Client Accolades & Testimonials',
    category: 'Social Proof',
    description: 'Luxury client testimonials highlighting verified transactions and advisory experiences',
    defaultContent: {
      heading: 'Trusted by Discerning Investors',
      subheading: 'Read what private family offices and luxury estate buyers say about Aura Heights.',
      items: [
        {
          quote: 'The 3D PlayCanvas model inspection gave us total confidence to finalize our hillside villa acquisition from Dubai.',
          author: 'Tariq Al-Mansoor',
          role: 'Managing Partner, Horizon Capital',
          stars: 5,
        },
        {
          quote: 'Absolute transparency, prompt title transfers, and bespoke architectural execution. Truly premier.',
          author: 'Dr. Sofia Chen',
          role: 'Private Investor',
          stars: 5,
        },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
    ],
  },

  cta_banner: {
    type: 'cta_banner',
    title: 'Call to Action Banner',
    category: 'Forms & Conversion',
    description: 'High-impact conversion banner with background styling, headline, and action button',
    defaultContent: {
      heading: 'Ready to Experience Premier Architectural Living?',
      subheading: 'Connect with our Senior Investment Advisory team for private portfolio viewings.',
      buttonText: 'Contact Concierge',
      buttonUrl: '/#contact',
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
      { key: 'buttonText', label: 'Button Text', type: 'text', variableCompatible: true },
      { key: 'buttonUrl', label: 'Button URL', type: 'url', variableCompatible: true },
    ],
  },

  faq_accordion: {
    type: 'faq_accordion',
    title: 'FAQ Accordion',
    category: 'Content & Text',
    description: 'Expandable frequently asked questions list for investor clarity',
    defaultContent: {
      heading: 'Frequently Asked Questions',
      subheading: 'Everything you need to know about purchasing and verifying luxury property with Aura Heights.',
      items: [
        { question: 'Are all property titles verified beforehand?', answer: 'Yes, every listing in our portfolio undergoes exhaustive legal due diligence with municipal registry verification before being onboarded.' },
        { question: 'Can international buyers purchase remotely?', answer: 'Absolutely. Utilizing our PlayCanvas 3D virtual walkthroughs and encrypted customer portal, international investors can inspect and execute acquisitions seamlessly.' },
        { question: 'How do the milestone payment schedules work?', answer: 'Our client portal provides milestone-driven construction billing schedules with direct invoice tracking and PDF generation.' },
      ],
    },
    fields: [
      { key: 'heading', label: 'Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Subheading', type: 'textarea', variableCompatible: true },
    ],
  },

  stats_counter: {
    type: 'stats_counter',
    title: 'Key Statistics & Milestones',
    category: 'Social Proof',
    description: 'Numeric milestone counters showing transaction volume, properties sold, and verified satisfaction',
    defaultContent: {
      items: [
        { value: '$450M+', label: 'Transaction Volume' },
        { value: '180+', label: 'Luxury Villas Delivered' },
        { value: '99.4%', label: 'Investor Satisfaction' },
        { value: '100%', label: 'Clear Title Guarantee' },
      ],
    },
    fields: [],
  },

  rich_text: {
    type: 'rich_text',
    title: 'Rich Content Block',
    category: 'Content & Text',
    description: 'Custom formatted text block with dynamic variable interpolation and typography controls',
    defaultContent: {
      contentHtml: '<h2>Welcome to {{brand.companyName}}</h2><p>Pioneering architectural living in {{brand.address}}.</p>',
    },
    fields: [
      { key: 'contentHtml', label: 'HTML / Text Content', type: 'textarea', variableCompatible: true },
    ],
  },

  template_c3: {
    type: 'template_c3',
    title: 'Template C3: Architectural Showcase',
    category: 'Content & Text',
    description: 'Premium visual region with eyebrow, headline, prose description, feature highlights, CTAs, and decorative stat badge',
    defaultContent: {
      eyebrow: 'BESPOKE ARCHITECTURAL MASTERPIECE',
      heading: 'Engineered for Uncompromising Elegance',
      description: 'Sculpted with imported thermal fenestrations and Italian stone, this signature layout sets a new standard for luxury residences.',
      visualUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      visualType: 'image',
      statBadge: '$2.4M Volume',
      statSubtext: 'Verified Valuation',
      primaryCtaText: 'Schedule Private Viewing',
      primaryCtaUrl: '/contact',
      secondaryCtaText: 'Explore 3D Tour',
      secondaryCtaUrl: '/#virtual-tour',
      layoutAlignment: 'image_right',
      items: [
        { title: 'Floor-to-Ceiling Thermal Glass', desc: '100% UV filtration and acoustic insulation', icon: 'Sparkles' },
        { title: 'Private Sky Pavilion', desc: 'Panoramic 360-degree terrace views', icon: 'Compass' },
        { title: 'Bank-Grade Clear Title', desc: 'Pre-verified escrow acquisition with legal guarantee', icon: 'ShieldCheck' },
      ],
    },
    fields: [
      { key: 'eyebrow', label: 'Eyebrow / Badge', type: 'text', variableCompatible: true },
      { key: 'heading', label: 'Headline', type: 'text', variableCompatible: true },
      { key: 'description', label: 'Prose Description', type: 'textarea', variableCompatible: true },
      { key: 'visualUrl', label: 'Hero Media URL (Image/Video)', type: 'url', variableCompatible: true },
      { key: 'statBadge', label: 'Decorative Stat Metric', type: 'text', variableCompatible: true },
      { key: 'statSubtext', label: 'Stat Label / Subtext', type: 'text', variableCompatible: true },
      { key: 'primaryCtaText', label: 'Primary Button Label', type: 'text', variableCompatible: true },
      { key: 'primaryCtaUrl', label: 'Primary Button Link', type: 'url', variableCompatible: true },
      { key: 'secondaryCtaText', label: 'Secondary Button Label', type: 'text', variableCompatible: true },
      { key: 'secondaryCtaUrl', label: 'Secondary Button Link', type: 'url', variableCompatible: true },
      {
        key: 'layoutAlignment',
        label: 'Layout Orientation',
        type: 'select',
        options: [
          { label: 'Visual on Right (Default)', value: 'image_right' },
          { label: 'Visual on Left', value: 'image_left' },
          { label: 'Stacked / Centered', value: 'stacked' },
        ],
      },
    ],
  },

  repeater: {
    type: 'repeater',
    title: 'Dynamic Data Repeater',
    category: 'Portfolios & Grids',
    description: 'Generic array repeater binding to property amenities, milestones, or custom collection lists',
    defaultContent: {
      heading: 'Signature Amenities & Features',
      subheading: 'Engineered for wellness, comfort, and uncompromising luxury.',
      source: '{{property.amenities}}',
      alias: 'item',
      layout: 'grid',
      columns: 3,
      itemHeading: '{{item.name}}',
      itemDesc: '{{item.desc}}',
      itemIcon: 'CheckCircle2',
    },
    fields: [
      { key: 'heading', label: 'Section Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Section Subheading', type: 'textarea', variableCompatible: true },
      { key: 'source', label: 'Array Source Variable', type: 'text', variableCompatible: true },
      { key: 'alias', label: 'Item Alias Name', type: 'text' },
      {
        key: 'layout',
        label: 'Display Layout',
        type: 'select',
        options: [
          { label: '3-Column Grid', value: 'grid' },
          { label: 'Stacked List', value: 'list' },
        ],
      },
    ],
  },

  gallery: {
    type: 'gallery',
    title: 'Interactive Photo Gallery',
    category: '3D & Media',
    description: 'Dynamic photo showcase with thumbnail strip and fullscreen lightbox modal',
    defaultContent: {
      heading: 'Architectural Photography Gallery',
      subheading: 'Explore high-resolution captures of the interior finishes, panoramic terraces, and grand atrium.',
      source: '{{property.gallery}}',
      columns: 3,
      images: [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      ],
    },
    fields: [
      { key: 'heading', label: 'Section Heading', type: 'text', variableCompatible: true },
      { key: 'subheading', label: 'Section Subheading', type: 'textarea', variableCompatible: true },
      { key: 'source', label: 'Dynamic Array Source (e.g. {{property.gallery}})', type: 'text', variableCompatible: true },
    ],
  },
};
