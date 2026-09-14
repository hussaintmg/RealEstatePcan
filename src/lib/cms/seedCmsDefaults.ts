import { connectToDatabase } from '../db';
import { CmsTheme } from '../../models/CmsTheme';
import { CmsLayout } from '../../models/CmsLayout';
import { CmsPage } from '../../models/CmsPage';
import { CmsTemplate } from '../../models/CmsTemplate';
import { User } from '../../models/User';
import mongoose from 'mongoose';

export async function ensureCmsSeeded() {
  await connectToDatabase();

  // Find or use admin user id
  let adminUser = await User.findOne({ isDeveloper: true }).lean();
  if (!adminUser) {
    adminUser = await User.findOne({}).lean();
  }
  const adminId = adminUser?._id || new mongoose.Types.ObjectId();

  // 1. SEED DEFAULT THEME
  const existingTheme = await CmsTheme.findOne({ isDefault: true }).lean();
  if (!existingTheme) {
    await CmsTheme.create({
      name: 'Aura Signature Dark Luxury',
      slug: 'default-luxury',
      isDefault: true,
      brand: {
        companyName: 'Aura Heights Luxury Estates',
        tagline: 'Architectural 3D Living Spaces',
        logoPrimary: '',
        logoDark: '',
        logoLight: '',
        logoMobile: '',
        favicon: '/favicon.ico',
        appIcon: '',
        footerLogo: '',
        authLogo: '',
        phone: '+92 (51) 880-9911',
        email: 'concierge@auraheights.local',
        address: 'Margalla Hillside Avenue, Sector F-7, Islamabad',
      },
      colors: {
        primary: '#3b82f6',
        secondary: '#6366f1',
        accent: '#10b981',
        background: '#0a0d14',
        surface: '#101522',
        text: '#ffffff',
        textMuted: '#94a3b8',
        border: 'rgba(255, 255, 255, 0.1)',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fonts: {
        headingFont: 'Inter, sans-serif',
        bodyFont: 'Inter, sans-serif',
        navigationFont: 'Inter, sans-serif',
        buttonFont: 'Inter, sans-serif',
      },
      scales: {
        borderRadius: '0.75rem',
        spacingScale: '1rem',
        shadowPreset: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        containerMaxWidth: '1280px',
      },
      createdBy: adminId,
    });
  }

  // 2. SEED DEFAULT NAVBAR
  const existingNavbar = await CmsLayout.findOne({ type: 'navbar', isDefault: true }).lean();
  if (!existingNavbar) {
    await CmsLayout.create({
      type: 'navbar',
      title: 'Aura Luxury Signature Navbar',
      slug: 'default-navbar',
      templateVariant: 'logo_left',
      isDefault: true,
      targetArea: 'public',
      content: {
        logo: {
          type: 'brand',
          text: 'AURA HEIGHTS',
          subtext: '3D Living Spaces',
          icon: 'Building2',
        },
        menuItems: [
          { id: 'm1', label: 'Home', url: '/', target: '_self' },
          { id: 'm2', label: 'Properties', url: '/properties', target: '_self' },
          { id: 'm3', label: '3D Virtual Tours', url: '/#virtual-tour', target: '_self', icon: 'Compass' },
          { id: 'm4', label: 'Contact', url: '/#contact', target: '_self' },
        ],
        actions: [
          { id: 'a1', label: 'Client / Staff Login', url: '/login', variant: 'outline', authCondition: 'guest' },
        ],
      },
      styling: {
        bgColor: '#0a0d14',
        isSticky: true,
        backdropBlur: true,
      },
      createdBy: adminId,
    });
  }

  // 3. SEED DEFAULT FOOTER
  const existingFooter = await CmsLayout.findOne({ type: 'footer', isDefault: true }).lean();
  if (!existingFooter) {
    await CmsLayout.create({
      type: 'footer',
      title: 'Aura Multi-Column Corporate Footer',
      slug: 'default-footer',
      templateVariant: 'multicolumn',
      isDefault: true,
      targetArea: 'public',
      content: {
        logo: {
          type: 'brand',
          text: 'AURA HEIGHTS',
          subtext: '3D Living Spaces',
          icon: 'Building2',
        },
        columns: [
          {
            id: 'c1',
            title: 'Quick Navigation',
            links: [
              { id: 'l1', label: 'Home Experience', url: '/' },
              { id: 'l2', label: 'Exclusive Listings', url: '/properties' },
              { id: 'l3', label: '3D PlayCanvas Tours', url: '/#virtual-tour' },
              { id: 'l4', label: 'Verified Customer Portal', url: '/portal' },
            ],
          },
          {
            id: 'c2',
            title: 'Property Types',
            links: [
              { id: 'l5', label: 'Signature Villas', url: '/properties?propertyType=Villa' },
              { id: 'l6', label: 'Skyline Penthouses', url: '/properties?propertyType=Penthouse' },
              { id: 'l7', label: 'Smart High-Rise Residences', url: '/properties?propertyType=Apartment' },
              { id: 'l8', label: 'Prime Commercial Suites', url: '/properties?propertyType=Commercial' },
            ],
          },
          {
            id: 'c3',
            title: 'Direct Advisory',
            links: [
              { id: 'l9', label: '+92 (51) 880-9911 / WhatsApp', url: 'tel:+92518809911', icon: 'Phone' },
              { id: 'l10', label: 'concierge@auraheights.local', url: 'mailto:concierge@auraheights.local', icon: 'Mail' },
              { id: 'l11', label: 'Margalla Hillside Avenue, Sector F-7, Islamabad', url: '#', icon: 'MapPin' },
            ],
          },
        ],
        copyrightText: '© 2026 Aura Heights Ltd. Powered by PlayCanvas 3D Engine & Next.js. Strict Privacy & Encrypted Document Retention.',
      },
      styling: {
        bgColor: '#070a0f',
      },
      createdBy: adminId,
    });
  }

  // 4. SEED DEFAULT TOPBAR
  const existingTopbar = await CmsLayout.findOne({ type: 'topbar', isDefault: true }).lean();
  if (!existingTopbar) {
    await CmsLayout.create({
      type: 'topbar',
      title: 'Aura VIP Announcement Topbar',
      slug: 'default-topbar',
      templateVariant: 'split',
      isDefault: true,
      targetArea: 'public',
      content: {
        announcement: {
          text: 'Private Viewing Appointments Now Open for The Skyview Horizon Villa',
          link: '/properties',
          badge: 'NEW RELEASE',
          showDismiss: true,
        },
      },
      styling: {
        bgColor: '#070a0f',
        textColor: '#94a3b8',
      },
      createdBy: adminId,
    });
  }

  // 5. SEED HOME CMS PAGE
  const existingHomePage = await CmsPage.findOne({ slug: 'home' }).lean();
  if (!existingHomePage) {
    await CmsPage.create({
      title: 'Home Experience',
      slug: 'home',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'Aura Heights | Premier 3D Architectural Estates',
        metaDescription: 'Experience panoramic hillscapes, bespoke contemporary villas, and real-time PlayCanvas 3D walkthroughs.',
      },
      sections: [
        {
          id: 'sec-hero',
          type: 'hero_video',
          title: 'Hero Video Scrubber',
          order: 1,
          isVisible: true,
          content: {
            badge: 'AURA SIGNATURE LIVING',
            heading: 'Contemporary Luxury Architecture',
            subheading: 'Immerse yourself in bespoke residences overlooking scenic ridgelines with zero ambiguity.',
            ctaText: 'Explore Estates',
            ctaUrl: '/properties',
            secondaryCtaText: '3D Virtual Tours',
            secondaryCtaUrl: '/#virtual-tour',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
          },
        },
        {
          id: 'sec-features',
          type: 'features_grid',
          title: 'Architectural Assurance Grid',
          order: 2,
          isVisible: true,
          content: {
            heading: 'Engineered For Ultra-High-Net-Worth Living',
            subheading: 'Every estate integrates state-of-the-art automation and structural resilience.',
            items: [
              { title: 'Interactive 3D Walkthroughs', desc: 'Inspect structural layouts and finishes with zero rendering delay.', icon: 'Compass' },
              { title: 'Margalla Hillside Panoramas', desc: 'Floor-to-ceiling panoramic thermal glass overlooking natural foliage.', icon: 'Sparkles' },
              { title: 'Bank-Grade Title Deeds', desc: '100% government-verified clear titles and escrow protection.', icon: 'ShieldCheck' },
            ],
          },
        },
        {
          id: 'sec-playcanvas',
          type: 'playcanvas_tour',
          title: '3D PlayCanvas Virtual Walkthrough',
          order: 3,
          isVisible: true,
          content: {
            badge: 'WEBGL 3D SHOWCASE',
            heading: 'PlayCanvas 3D Virtual Walkthrough',
            subheading: 'Inspect fine Italian materials, switch floors, and tour architectural suites in real-time.',
            modelUrl: '',
          },
        },
        {
          id: 'sec-properties',
          type: 'properties_grid',
          title: 'Curated Architectural Portfolio',
          order: 4,
          isVisible: true,
          content: {
            heading: 'Curated Signature Estates',
            subheading: 'Handpicked selection of premier villas and duplex penthouses.',
            limit: 6,
          },
        },
        {
          id: 'sec-consultation',
          type: 'lead_form',
          title: 'VIP Private Advisory Consultation',
          order: 5,
          isVisible: true,
          content: {
            badge: 'PRIVATE DESK',
            heading: 'Schedule a Confidential Private Viewing',
            subheading: 'Our Senior Property Directors provide direct advisory for high-net-worth investors.',
          },
        },
        {
          id: 'sec-testimonials',
          type: 'testimonials',
          title: 'Client Accolades',
          order: 6,
          isVisible: true,
          content: {
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
        },
      ],
      createdBy: adminId,
    });
  }

  // 6. SEED TEMPLATE C3 AS SYSTEM PRESET
  const existingTemplateC3 = await CmsTemplate.findOne({ slug: 'template-c3' }).lean();
  if (!existingTemplateC3) {
    await CmsTemplate.create({
      name: 'Template C3: Architectural Showcase',
      slug: 'template-c3',
      category: 'features',
      description: 'Signature visual layout with high-impact hero visual, eyebrow, headline, feature highlights, and decorative stat badge',
      templateType: 'section',
      isSystemPreset: true,
      version: 1,
      schemaData: {
        type: 'template_c3',
        title: 'Template C3: Architectural Showcase',
        order: 2,
        isVisible: true,
        content: {
          eyebrow: 'SIGNATURE RESIDENTIAL SHOWCASE',
          heading: 'Engineered For Ultra-Luxury Living',
          description: 'A bespoke architectural achievement combining floor-to-ceiling thermal glass, imported Italian stone, and panoramic city vistas.',
          visualUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
          visualType: 'image',
          statBadge: '$2.4M Volume',
          statSubtext: 'Verified Valuation',
          primaryCtaText: 'Schedule Private Viewing',
          primaryCtaUrl: '/contact',
          secondaryCtaText: 'Explore 3D Virtual Tour',
          secondaryCtaUrl: '/3d-experience',
          layoutAlignment: 'image_right',
          items: [
            { title: 'Italian Carrara Marble', desc: 'Hand-selected honed slabs with radiant floor heating', icon: 'Sparkles' },
            { title: 'Panoramic Hillside Vistas', desc: 'Floor-to-ceiling acoustic fenestrations', icon: 'Compass' },
            { title: 'Government-Verified Clear Title', desc: 'Bank-grade title escrow protection', icon: 'ShieldCheck' },
          ],
        },
      },
      createdBy: adminId,
    });
  }

  // 7. SEED ABOUT PAGE (Uses Template C3)
  const existingAbout = await CmsPage.findOne({ slug: 'about' }).lean();
  if (!existingAbout) {
    await CmsPage.create({
      title: 'About Skyline Residences',
      slug: 'about',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'About Us | Skyline Residences & Aura Heights',
        metaDescription: 'Learn about our architectural heritage, sustainable design principles, and international real estate development philosophy.',
      },
      sections: [
        {
          id: 'about-hero',
          type: 'hero_video',
          title: 'Heritage & Vision Hero',
          order: 1,
          isVisible: true,
          content: {
            badge: 'ABOUT OUR HERITAGE',
            heading: 'Architectural Vision That Elevates Living',
            subheading: 'Pioneering ultra-prime luxury residential developments with zero compromise on structural integrity.',
            ctaText: 'Explore Developments',
            ctaUrl: '/properties',
            secondaryCtaText: 'Our Leadership',
            secondaryCtaUrl: '/about#leadership',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
          },
        },
        {
          id: 'about-c3-instance',
          type: 'template_c3',
          title: 'Template C3 - Design Philosophy',
          order: 2,
          isVisible: true,
          content: {
            eyebrow: 'DEVELOPMENT PHILOSOPHY',
            heading: 'Where Monolithic Form Meets Modern Serenity',
            description: 'Every Skyline residence is an organic extension of its natural topography, engineered to maximize daylight and panoramic viewpoints.',
            visualUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
            statBadge: '180+ Delivered',
            statSubtext: 'Signature Residences',
            primaryCtaText: 'Schedule Consultation',
            primaryCtaUrl: '/contact',
            secondaryCtaText: '3D Experience',
            secondaryCtaUrl: '/3d-experience',
            layoutAlignment: 'image_left',
            items: [
              { title: 'Sustainable Geothermal Engineering', desc: '50% reduction in heating and cooling carbon footprint', icon: 'Sparkles' },
              { title: 'Earthquake-Resilient Framework', desc: 'Structural core rated for seismic resistance exceeding zone 4 standards', icon: 'ShieldCheck' },
            ],
          },
        },
        {
          id: 'about-stats',
          type: 'stats_counter',
          title: 'Operational Achievements',
          order: 3,
          isVisible: true,
          content: {
            items: [
              { value: '$450M+', label: 'Global Transaction Volume' },
              { value: '180+', label: 'Estates Delivered' },
              { value: '99.4%', label: 'Discerning Buyer Satisfaction' },
              { value: '100%', label: 'Encumbrance-Free Clear Deeds' },
            ],
          },
        },
        {
          id: 'about-cta',
          type: 'cta_banner',
          title: 'Inquire Today',
          order: 4,
          isVisible: true,
          content: {
            heading: 'Begin Your Private Property Acquisition',
            subheading: 'Contact our Senior Advisory desk to receive confidential brochures and financial schedules.',
            buttonText: 'Connect With Concierge',
            buttonUrl: '/contact',
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 8. SEED INVESTMENT PAGE (Uses Template C3)
  const existingInvestment = await CmsPage.findOne({ slug: 'investment' }).lean();
  if (!existingInvestment) {
    await CmsPage.create({
      title: 'Institutional & Private Wealth Investment',
      slug: 'investment',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'Real Estate Investment Advisory | Skyline Residences',
        metaDescription: 'Capital preservation, verified yields, and prime property acquisitions for private family offices and sovereign wealth.',
      },
      sections: [
        {
          id: 'inv-hero',
          type: 'hero_video',
          title: 'Investment Advisory Hero',
          order: 1,
          isVisible: true,
          content: {
            badge: 'CAPITAL GROWTH & WEALTH PRESERVATION',
            heading: 'Institutional-Grade Prime Real Estate Investment',
            subheading: 'Secure tangible real estate assets positioned in top-tier growth corridors with strong rental yields.',
            ctaText: 'Request Investment Deck',
            ctaUrl: '/contact',
            secondaryCtaText: 'Explore Yields',
            secondaryCtaUrl: '/investment#metrics',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-living-room-with-a-modern-interior-design-41484-large.mp4',
          },
        },
        {
          id: 'inv-c3-instance',
          type: 'template_c3',
          title: 'Template C3 - Capital Growth',
          order: 2,
          isVisible: true,
          content: {
            eyebrow: 'CAPITAL APPRECIATION METRICS',
            heading: 'Predictable Yields in Prime Locations',
            description: 'Historical data demonstrates 14.8% annual compound capital appreciation across our luxury hillside developments.',
            visualUrl: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
            statBadge: '14.8% CAGR',
            statSubtext: '5-Year Capital Growth',
            primaryCtaText: 'Download Pro-Forma Deck',
            primaryCtaUrl: '/contact',
            secondaryCtaText: 'Financial Calculator',
            secondaryCtaUrl: '/properties',
            layoutAlignment: 'image_right',
            items: [
              { title: 'Pre-Leased Institutional Tenancies', desc: 'Direct corporate long-term leases with diplomatic missions', icon: 'ShieldCheck' },
              { title: 'Tax-Advantaged Escrow Accounts', desc: 'Secure transparent acquisition frameworks for foreign nationals', icon: 'CheckCircle2' },
            ],
          },
        },
        {
          id: 'inv-mortgage',
          type: 'mortgage_calc',
          title: 'Investment Calculator',
          order: 3,
          isVisible: true,
          content: {
            heading: 'Mortgage & Yield Projection Model',
            subheading: 'Model capital requirements, monthly debt service, and net operating cash flows.',
            defaultPrice: 2400000,
          },
        },
        {
          id: 'inv-faq',
          type: 'faq_accordion',
          title: 'Investment FAQ',
          order: 4,
          isVisible: true,
          content: {
            heading: 'Frequently Asked Investment Questions',
            subheading: 'Key legal and financial details for international family offices.',
            items: [
              { question: 'What is the minimum investment threshold?', answer: 'Individual luxury units start from $650,000, while whole-floor private suites range upwards of $2,500,000.' },
              { question: 'Can international funds repatriate profits freely?', answer: 'Yes. State bank registered escrow accounts permit 100% legal capital and dividend repatriation.' },
            ],
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 9. SEED 3D EXPERIENCE PAGE
  const existing3D = await CmsPage.findOne({ slug: '3d-experience' }).lean();
  if (!existing3D) {
    await CmsPage.create({
      title: 'Interactive 3D Virtual Tour Showcase',
      slug: '3d-experience',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'PlayCanvas 3D Virtual Walkthrough | Skyline Residences',
        metaDescription: 'Tour our architectural penthouses and luxury villas in real-time WebGL with interactive materials and floor slicing.',
      },
      sections: [
        {
          id: '3d-viewer-main',
          type: 'playcanvas_tour',
          title: 'PlayCanvas 3D WebGL Engine',
          order: 1,
          isVisible: true,
          content: {
            badge: 'WEBGL 3D INTERACTIVE WALKTHROUGH',
            heading: 'Cinematic 3D Virtual Tour & Material Customizer',
            subheading: 'Inspect real Italian marble, switch between floorplans, and fly through suites in real-time.',
            modelUrl: '',
          },
        },
        {
          id: '3d-features',
          type: 'features_grid',
          title: '3D Technology Assurance',
          order: 2,
          isVisible: true,
          content: {
            heading: 'Cutting-Edge WebGL Architectural Visualization',
            subheading: 'Inspect fine construction elements without downloading heavy desktop applications.',
            items: [
              { title: 'Sub-Millimeter Geometry', desc: 'Direct CAD-to-WebGL spatial accuracy', icon: 'Compass' },
              { title: 'Physical Material Shaders', desc: 'Accurate ray reflection and specular dispersion', icon: 'Sparkles' },
              { title: 'Multi-Floor Slicing', desc: 'Inspect structural layouts across all levels with 1 click', icon: 'ShieldCheck' },
            ],
          },
        },
        {
          id: '3d-booking',
          type: 'lead_form',
          title: 'Book In-Person Tour',
          order: 3,
          isVisible: true,
          content: {
            badge: 'PHYSICAL VIEWING',
            heading: 'Schedule an On-Site VIP Inspection',
            subheading: 'Experience the real-life luxury residence accompanied by our Lead Architectural Director.',
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 10. SEED CONTACT PAGE
  const existingContact = await CmsPage.findOne({ slug: 'contact' }).lean();
  if (!existingContact) {
    await CmsPage.create({
      title: 'Contact Concierge & Private Advisory',
      slug: 'contact',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'Contact Concierge | Skyline Residences',
        metaDescription: 'Schedule a private consultation, request brochures, or speak directly with our Senior Advisory team.',
      },
      sections: [
        {
          id: 'contact-form-main',
          type: 'lead_form',
          title: 'VIP Private Advisory Consultation',
          order: 1,
          isVisible: true,
          content: {
            badge: 'DIRECT ADVISORY DESK',
            heading: 'Connect With Our Senior Real Estate Directors',
            subheading: 'Inquire about private off-market listings, schedule physical tours, or consult on portfolio acquisitions.',
          },
        },
        {
          id: 'contact-faq',
          type: 'faq_accordion',
          title: 'Contact FAQ',
          order: 2,
          isVisible: true,
          content: {
            heading: 'Concierge & Scheduling Questions',
            subheading: 'Frequently asked logistical inquiries.',
            items: [
              { question: 'Where is the physical presentation center located?', answer: 'Our private lounge is located on Margalla Hillside Avenue, Sector F-7, Islamabad. Prior appointment required.' },
              { question: 'What are the consultation operating hours?', answer: 'Our private advisory desk operates Monday through Saturday, 9:00 AM to 8:00 PM (GMT+5).' },
            ],
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 11. SEED REUSABLE PROPERTY DETAIL TEMPLATE
  const existingPropTemplate = await CmsPage.findOne({ slug: 'property-detail-template' }).lean();
  if (!existingPropTemplate) {
    await CmsPage.create({
      title: 'Universal Property Detail Template',
      slug: 'property-detail-template',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: '{{property.title}} | Skyline Residences',
        metaDescription: '{{property.description}}',
      },
      sections: [
        {
          id: 'prop-hero',
          type: 'hero',
          title: 'Property Hero Header',
          order: 1,
          isVisible: true,
          content: {
            badge: '{{property.propertyType}} • VERIFIED LUXURY LISTING',
            heading: '{{property.title}}',
            subheading: '{{property.location.address}}, {{property.location.city}} • ${{property.price}}',
            ctaLabel: 'Schedule Private Viewing',
            ctaUrl: '#inquiry',
            secondaryCtaLabel: 'Calculate Financing',
            secondaryCtaUrl: '#mortgage',
          },
        },
        {
          id: 'prop-3d-tour',
          type: 'playcanvas_tour',
          title: 'Interactive 3D Virtual Walkthrough',
          order: 2,
          isVisible: true,
          content: {
            badge: 'PLAYCANVAS 3D ENGINE',
            heading: 'Interactive 3D Architectural Walkthrough',
            subheading: 'Inspect real materials, slice floors, and explore {{property.title}} in WebGL.',
            modelUrl: '{{property.model3dUrl}}',
          },
        },
        {
          id: 'prop-c3-showcase',
          type: 'template_c3',
          title: 'Architectural Details & Specifications',
          order: 3,
          isVisible: true,
          content: {
            eyebrow: 'ARCHITECTURAL PROFILE',
            heading: 'Unrivaled Quality Crafted for Longevity',
            description: '{{property.description}}',
            statNumber: '{{property.specs.areaSqFt}}',
            statLabel: 'Total Living Area (Sq Ft)',
            featurePoints: [
              '{{property.specs.bedrooms}} Master Bedroom Suites with Ensuite Stone Bathrooms',
              '{{property.specs.bathrooms}} Designer Bathrooms with Imported Dornbracht Fittings',
              'Year Built: {{property.specs.yearBuilt}} with 10-Year Structural Warranty',
              'Floor-to-Ceiling Thermal Acoustic Glazing with Mountain Views',
            ],
            ctaLabel: 'Request Architectural Blueprint',
            ctaUrl: '/contact?interest=blueprint',
          },
        },
        {
          id: 'prop-amenities-repeater',
          type: 'repeater',
          title: 'Features & Amenities Grid',
          order: 4,
          isVisible: true,
          content: {
            sourcePath: 'property.amenities',
            itemAlias: 'amenity',
            title: 'Included Luxury Amenities',
            subtitle: 'Every residence includes full access to our private estate amenities.',
            cardType: 'feature',
          },
        },
        {
          id: 'prop-mortgage',
          type: 'mortgage_calculator',
          title: 'Mortgage & Investment Financing',
          order: 5,
          isVisible: true,
          content: {
            heading: 'Estimated Investment & Amortization Calculator',
            subheading: 'Model your capital allocation with prevailing 2026 luxury mortgage interest rates.',
          },
        },
        {
          id: 'prop-inquiry-form',
          type: 'lead_form',
          title: 'Schedule a Private Viewing',
          order: 6,
          isVisible: true,
          content: {
            badge: 'DIRECT LISTING DIRECTOR',
            heading: 'Schedule a Private In-Person Viewing',
            subheading: 'Receive a personalized tour of {{property.title}} with our Senior Advisory Team.',
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 12. SEED LOCATIONS PAGE
  const existingLocations = await CmsPage.findOne({ slug: 'locations' }).lean();
  if (!existingLocations) {
    await CmsPage.create({
      title: 'Prime Locations & Neighborhoods',
      slug: 'locations',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'Strategic Locations | Skyline Residences',
        metaDescription: 'Discover our handpicked prime sites across capital hillsides, serene lakes, and metropolitan hubs.',
      },
      sections: [
        {
          id: 'loc-hero',
          type: 'hero',
          title: 'Strategic Geography',
          order: 1,
          isVisible: true,
          content: {
            badge: 'PRIME SITES',
            heading: 'Situated In The World’s Most Coveted Enclaves',
            subheading: 'Proximity to diplomatic districts, private aviation hubs, and championship golf courses.',
            ctaLabel: 'Explore All Properties',
            ctaUrl: '/properties',
          },
        },
        {
          id: 'loc-c3',
          type: 'template_c3',
          title: 'Margalla Hillside Ridge',
          order: 2,
          isVisible: true,
          content: {
            eyebrow: 'FEATURED LOCATION',
            heading: 'Margalla Foothills • Sector F-7 / E-7',
            description: 'Surrounded by protected national reserve forest, offering pristine air quality, 24/7 biometric security perimeters, and 10-minute access to federal embassies.',
            statNumber: '100%',
            statLabel: 'Protected Green Belt View',
            featurePoints: [
              'Zero Industrial Pollution Perimeter',
              'Helipad & Private Airstrip Proximity (15 min)',
              'Championship Golf & Country Club Membership Included',
            ],
            ctaLabel: 'View Hillside Properties',
            ctaUrl: '/properties?location=Islamabad',
          },
        },
      ],
      createdBy: adminId,
    });
  }

  // 13. SEED PRIVATE VIEWING PAGE
  const existingPrivateViewing = await CmsPage.findOne({ slug: 'private-viewing' }).lean();
  if (!existingPrivateViewing) {
    await CmsPage.create({
      title: 'Private Viewing & Bespoke Tour',
      slug: 'private-viewing',
      status: 'published',
      isPublished: true,
      seo: {
        metaTitle: 'Book Private Viewing | Skyline Residences',
        metaDescription: 'Reserve an exclusive chauffeured inspection with our Managing Director.',
      },
      sections: [
        {
          id: 'pv-hero',
          type: 'hero',
          title: 'Bespoke Experience',
          order: 1,
          isVisible: true,
          content: {
            badge: 'BY INVITATION & APPOINTMENT',
            heading: 'Experience Architectural Grandeur in Person',
            subheading: 'Chauffeured arrival, confidential NDA review, and private property walk-through.',
            ctaLabel: 'Reserve Date',
            ctaUrl: '#booking-form',
          },
        },
        {
          id: 'pv-form',
          type: 'lead_form',
          title: 'VIP Reservation Form',
          order: 2,
          isVisible: true,
          content: {
            badge: 'PRIVATE CONCIERGE',
            heading: 'Select Your Preferred Inspection Date',
            subheading: 'Our client liaison officer will confirm itinerary within 1 business hour.',
          },
        },
      ],
      createdBy: adminId,
    });
  }
}
