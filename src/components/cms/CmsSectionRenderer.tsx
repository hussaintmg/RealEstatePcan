'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ICmsSection } from '@/models/CmsPage';
import {
  resolveDeepObjectVariables,
  evaluateAllConditions,
  interpolateTextWithVariables,
} from '@/lib/cms/variableEngine';
import { DynamicCmsIcon } from '@/lib/cms/iconResolver';
import { PlayCanvasViewer } from '@/components/3d/PlayCanvasViewer';
import { ScrollVideoScrubber } from '@/components/media/ScrollVideoScrubber';
import { MortgageCalculator } from '@/components/properties/MortgageCalculator';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Star,
  Compass,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';

interface SectionRendererProps {
  section: ICmsSection;
  dataContext?: Record<string, any>;
  onCompareToggle?: (property: any) => void;
  comparisonIds?: string[];
}

export const CmsSectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  dataContext = {},
  onCompareToggle,
  comparisonIds = [],
}) => {
  // 1. Check Visibility
  if (section.isVisible === false) return null;

  // 2. Evaluate Conditional Visibility Rules
  if (!evaluateAllConditions(section.conditions, dataContext)) {
    return null;
  }

  // 3. Resolve Deep Variables in Content
  const content = resolveDeepObjectVariables(section.content || {}, dataContext);

  // 4. Extract Design & Animation Tokens
  const design = section.design || {};
  const animation = section.animation || { type: 'fade', duration: 0.5 };

  // Animation Variants
  const getMotionProps = () => {
    switch (animation.type) {
      case 'slide_up':
        return {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: animation.duration || 0.6, delay: animation.delay || 0 },
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.94 },
          whileInView: { opacity: 1, scale: 1 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration: animation.duration || 0.5, delay: animation.delay || 0 },
        };
      case 'reveal':
        return {
          initial: { opacity: 0, filter: 'blur(8px)' },
          whileInView: { opacity: 1, filter: 'blur(0px)' },
          viewport: { once: true },
          transition: { duration: animation.duration || 0.7, delay: animation.delay || 0 },
        };
      case 'none':
        return {};
      default: // 'fade'
        return {
          initial: { opacity: 0 },
          whileInView: { opacity: 1 },
          viewport: { once: true },
          transition: { duration: animation.duration || 0.5, delay: animation.delay || 0 },
        };
    }
  };

  const getHoverProps = () => {
    switch (animation.hoverEffect) {
      case 'lift':
        return { whileHover: { y: -6 } };
      case 'scale':
        return { whileHover: { scale: 1.02 } };
      case 'glow':
        return { whileHover: { boxShadow: '0 0 30px rgba(59, 130, 246, 0.4)' } };
      default:
        return {};
    }
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: design.bgColor || undefined,
    color: design.textColor || undefined,
    paddingTop: design.padding || undefined,
    paddingBottom: design.padding || undefined,
    borderRadius: design.borderRadius || undefined,
  };

  return (
    <motion.section
      {...getMotionProps()}
      {...getHoverProps()}
      style={sectionStyle}
      className={`w-full relative transition-all ${design.customClasses || ''}`}
    >
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8"
        style={{ maxWidth: design.maxWidth || '1280px' }}
      >
        {/* DISPATCH TO BLOCK TYPE RENDERERS */}
        {renderBlockContent(section.type, content, onCompareToggle, comparisonIds, dataContext)}
      </div>
    </motion.section>
  );
};

// Sub-renderers for each Block Type
function renderBlockContent(
  type: string,
  content: any,
  onCompareToggle?: (prop: any) => void,
  comparisonIds: string[] = [],
  dataContext: Record<string, any> = {}
) {
  switch (type) {
    case 'hero_video':
      return <HeroVideoBlock content={content} />;
    case 'playcanvas_tour':
      return <PlayCanvasBlock content={content} />;
    case 'features_grid':
      return <FeaturesGridBlock content={content} />;
    case 'properties_grid':
      return <PropertiesGridBlock content={content} onCompareToggle={onCompareToggle} comparisonIds={comparisonIds} />;
    case 'mortgage_calc':
      return <MortgageCalcBlock content={content} />;
    case 'lead_form':
      return <LeadFormBlock content={content} />;
    case 'testimonials':
      return <TestimonialsBlock content={content} />;
    case 'cta_banner':
      return <CtaBannerBlock content={content} />;
    case 'faq_accordion':
      return <FaqBlock content={content} />;
    case 'stats_counter':
      return <StatsBlock content={content} />;
    case 'rich_text':
      return <RichTextBlock content={content} />;
    case 'template_c3':
      return <TemplateC3Block content={content} />;
    case 'repeater':
      return <RepeaterBlock content={content} dataContext={dataContext} />;
    case 'gallery':
      return <GalleryBlock content={content} />;
    default:
      return (
        <div className="p-8 border border-dashed border-white/10 rounded-2xl text-center text-xs text-slate-500">
          CMS Block: {type}
        </div>
      );
  }
}

// 1. Hero Video Scrubber Block
const HeroVideoBlock = ({ content }: { content: any }) => {
  return (
    <div className="relative py-8">
      {/* Sticky GSAP Video Scrubber */}
      <ScrollVideoScrubber videoSrc={content.videoUrl} />

      {/* Hero Headline Overlay */}
      <div className="relative z-10 max-w-3xl space-y-5 pt-6">
        {content.badge && (
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{content.badge}</span>
          </div>
        )}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          {content.heading || 'Contemporary Luxury Architecture'}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
          {content.subheading || 'Immerse yourself in bespoke residences overlooking scenic ridgelines.'}
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          {content.ctaText && (
            <Link
              href={content.ctaUrl || '/properties'}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <span>{content.ctaText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {content.secondaryCtaText && (
            <Link
              href={content.secondaryCtaUrl || '/#virtual-tour'}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Compass className="w-4 h-4 text-blue-400" />
              <span>{content.secondaryCtaText}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// 2. PlayCanvas 3D Tour Block
const PlayCanvasBlock = ({ content }: { content: any }) => {
  return (
    <div id="virtual-tour" className="py-12 space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        {content.badge && (
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
            {content.badge}
          </span>
        )}
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {content.heading || 'PlayCanvas 3D Virtual Walkthrough'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          {content.subheading || 'Inspect fine Italian materials, switch floors, and tour architectural suites in real-time.'}
        </p>
      </div>

      <PlayCanvasViewer modelUrl={content.modelUrl} />
    </div>
  );
};

// 3. Features Grid Block
const FeaturesGridBlock = ({ content }: { content: any }) => {
  const items = content.items || [];
  return (
    <div className="py-12 space-y-8">
      {(content.heading || content.subheading) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {content.heading && <h2 className="text-2xl sm:text-3xl font-bold text-white">{content.heading}</h2>}
          {content.subheading && <p className="text-xs text-slate-400">{content.subheading}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item: any, i: number) => (
          <div
            key={i}
            className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3 hover:border-blue-500/40 transition-all group"
          >
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl w-fit group-hover:scale-110 transition-transform">
              <DynamicCmsIcon name={item.icon || 'Sparkles'} className="w-5 h-5" fallbackIcon={<Sparkles className="w-5 h-5" />} />
            </div>
            <h3 className="text-base font-bold text-white">{item.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// 4. Properties Grid Block
const PropertiesGridBlock = ({
  content,
  onCompareToggle,
  comparisonIds,
}: {
  content: any;
  onCompareToggle?: (p: any) => void;
  comparisonIds: string[];
}) => {
  const mockEstates = [
    {
      _id: 'prop-1',
      title: 'The Skyview Horizon Villa',
      price: 1850000,
      location: { city: 'Islamabad', address: 'Margalla Hillside Avenue' },
      specs: { bedrooms: 5, bathrooms: 6, areaSqFt: 5200 },
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: 'prop-2',
      title: 'Azure Bayfront Modern Mansion',
      price: 2400000,
      location: { city: 'Karachi', address: 'Creek Marina Precinct' },
      specs: { bedrooms: 6, bathrooms: 7, areaSqFt: 6800 },
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    },
    {
      _id: 'prop-3',
      title: 'Elysian Golf Estate Residence',
      price: 1350000,
      location: { city: 'Lahore', address: 'DHA Phase 6 Fairways' },
      specs: { bedrooms: 4, bathrooms: 5, areaSqFt: 4400 },
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="py-12 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {content.heading || 'Curated Signature Estates'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {content.subheading || 'Handpicked selection of premier villas and duplex penthouses.'}
          </p>
        </div>
        <Link
          href="/properties"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          <span>View All Estates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockEstates.map((prop) => {
          const isComparing = comparisonIds.includes(prop._id);
          return (
            <div
              key={prop._id}
              className="group bg-[#101522] border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all shadow-xl"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={prop.image}
                  alt={prop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-xl text-emerald-400 font-bold text-xs">
                  ${prop.price.toLocaleString()}
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                    {prop.title}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{prop.location.address}, {prop.location.city}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-[11px] text-slate-300 text-center">
                  <div>
                    <span className="block font-bold text-white">{prop.specs.bedrooms} Beds</span>
                    <span className="text-slate-500 text-[10px]">Suites</span>
                  </div>
                  <div>
                    <span className="block font-bold text-white">{prop.specs.bathrooms} Baths</span>
                    <span className="text-slate-500 text-[10px]">En-Suite</span>
                  </div>
                  <div>
                    <span className="block font-bold text-white">{prop.specs.areaSqFt}</span>
                    <span className="text-slate-500 text-[10px]">Sq Ft</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Link
                    href={`/properties/${prop._id}`}
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center space-x-1"
                  >
                    <span>View 3D Walkthrough</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {onCompareToggle && (
                    <button
                      type="button"
                      onClick={() => onCompareToggle(prop)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        isComparing
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {isComparing ? 'Comparing' : '+ Compare'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 5. Mortgage Calculator Block
const MortgageCalcBlock = ({ content }: { content: any }) => {
  return (
    <div className="py-12 space-y-6">
      {(content.heading || content.subheading) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white">{content.heading || 'Financing & Mortgage Estimation'}</h2>
          <p className="text-xs text-slate-400">{content.subheading || 'Calculate monthly payments and taxes.'}</p>
        </div>
      )}
      <MortgageCalculator propertyPrice={content.defaultPrice || 1850000} />
    </div>
  );
};

// 6. VIP Lead Consultation Form Block
const LeadFormBlock = ({ content }: { content: any }) => {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', budget: '1500000', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="contact" className="py-12">
      <div className="max-w-2xl mx-auto bg-[#101522] border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          {content.badge && (
            <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
              {content.badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {content.heading || 'Schedule a Confidential Viewing'}
          </h2>
          <p className="text-xs text-slate-400">
            {content.subheading || 'Our Senior Property Directors provide direct advisory.'}
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-300">Viewing Request Registered</p>
            <p className="text-xs text-slate-400">Our senior advisor will contact you within 2 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="e.g. Tariq Khan"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 mb-1">Telephone / WhatsApp</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Investment Budget ($)</label>
                <select
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="1000000">$1,000,000 - $1,500,000</option>
                  <option value="2000000">$1,500,000 - $3,000,000</option>
                  <option value="5000000">$3,000,000+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Notes / Preferences</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Specific preferences, requested viewing date, or 3D tour queries..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Request Private Consultation</span>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 7. Testimonials Block
const TestimonialsBlock = ({ content }: { content: any }) => {
  const items = content.items || [];
  return (
    <div className="py-12 space-y-8">
      {(content.heading || content.subheading) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{content.heading}</h2>
          <p className="text-xs text-slate-400">{content.subheading}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item: any, i: number) => (
          <div key={i} className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
            <div className="flex text-amber-400 space-x-1">
              {[...Array(item.stars || 5)].map((_, s) => (
                <Star key={s} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              "{item.quote}"
            </p>
            <div>
              <p className="text-xs font-bold text-white">{item.author}</p>
              <p className="text-[11px] text-slate-400">{item.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 8. CTA Banner Block
const CtaBannerBlock = ({ content }: { content: any }) => {
  return (
    <div className="py-12">
      <div className="p-10 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/40 border border-blue-500/30 rounded-3xl text-center space-y-5">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">{content.heading}</h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">{content.subheading}</p>
        {content.buttonText && (
          <Link
            href={content.buttonUrl || '/properties'}
            className="inline-flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <span>{content.buttonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
};

// 9. FAQ Accordion Block
const FaqBlock = ({ content }: { content: any }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = content.items || [];

  return (
    <div className="py-12 space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{content.heading}</h2>
        <p className="text-xs text-slate-400">{content.subheading}</p>
      </div>

      <div className="space-y-3">
        {items.map((item: any, i: number) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:bg-white/5 transition-colors"
              >
                <span>{item.question}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-2"
                  >
                    {item.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 10. Stats Counter Block
const StatsBlock = ({ content }: { content: any }) => {
  const items = content.items || [];
  return (
    <div className="py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item: any, i: number) => (
        <div key={i} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-center space-y-1">
          <span className="text-2xl sm:text-3xl font-black text-white">{item.value}</span>
          <span className="text-[11px] text-slate-400 block">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

// 11. Rich Text Block
const RichTextBlock = ({ content }: { content: any }) => {
  return (
    <div
      className="py-8 prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content.contentHtml || '' }}
    />
  );
};

// 12. Template C3: Architectural Showcase Block
const TemplateC3Block = ({ content }: { content: any }) => {
  const isImageLeft = content.layoutAlignment === 'image_left';
  const isStacked = content.layoutAlignment === 'stacked';
  const items = content.items || [];

  return (
    <div className="py-12 sm:py-16">
      <div
        className={`grid gap-10 lg:gap-16 items-center ${
          isStacked
            ? 'grid-cols-1 text-center max-w-4xl mx-auto'
            : isImageLeft
            ? 'grid-cols-1 lg:grid-cols-2 lg:grid-flow-dense'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {/* Visual Region */}
        <div
          className={`relative group ${
            isImageLeft ? 'lg:col-start-1' : isStacked ? 'w-full' : 'lg:col-start-2'
          }`}
        >
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 aspect-[4/3] sm:aspect-[16/10]">
            <img
              src={content.visualUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80'}
              alt={content.heading || 'Architectural Showcase'}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-transparent to-transparent opacity-80" />

            {/* Decorative Floating Stat Badge */}
            {content.statBadge && (
              <div className="absolute bottom-6 left-6 p-4 bg-[#101522]/90 backdrop-blur-xl border border-white/15 rounded-2xl shadow-xl space-y-0.5 text-left">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tight block">
                  {content.statBadge}
                </span>
                {content.statSubtext && (
                  <span className="text-[10px] sm:text-xs text-blue-400 uppercase tracking-wider font-semibold block">
                    {content.statSubtext}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content Column */}
        <div
          className={`space-y-6 ${
            isImageLeft ? 'lg:col-start-2' : isStacked ? 'max-w-2xl mx-auto' : 'lg:col-start-1'
          }`}
        >
          {content.eyebrow && (
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{content.eyebrow}</span>
            </div>
          )}

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {content.heading || 'Engineered for Uncompromising Elegance'}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            {content.description || 'Sculpted with imported thermal fenestrations and Italian stone.'}
          </p>

          {/* Feature Points List */}
          {items.length > 0 && (
            <div className="space-y-3 pt-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-start space-x-3 text-left">
                  <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-blue-400 mt-0.5">
                    <DynamicCmsIcon name={item.icon || 'CheckCircle2'} className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">{item.title}</h4>
                    {item.desc && <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{item.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTAs */}
          <div className={`flex flex-wrap gap-4 pt-4 ${isStacked ? 'justify-center' : ''}`}>
            {content.primaryCtaText && (
              <Link
                href={content.primaryCtaUrl || '/contact'}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
              >
                <span>{content.primaryCtaText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {content.secondaryCtaText && (
              <Link
                href={content.secondaryCtaUrl || '/#virtual-tour'}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold rounded-xl transition-all"
              >
                <span>{content.secondaryCtaText}</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 13. Dynamic Repeater Block
const RepeaterBlock = ({ content, dataContext }: { content: any; dataContext: Record<string, any> }) => {
  // Resolve source array from dataContext or content
  let items: any[] = [];
  if (Array.isArray(content.items)) {
    items = content.items;
  } else if (content.source) {
    // E.g. "{{property.amenities}}" -> resolve from dataContext
    const cleanKey = content.source.replace(/[{}]/g, '').trim();
    const parts = cleanKey.split('.');
    let cur = dataContext;
    for (const p of parts) {
      if (cur && typeof cur === 'object') cur = cur[p];
      else {
        cur = undefined;
        break;
      }
    }
    if (Array.isArray(cur)) {
      items = cur;
    }
  }

  // Fallback items if array empty in demo
  if (items.length === 0) {
    items = [
      { name: 'Interactive 3D Virtual Walkthrough', icon: 'Compass', desc: 'Real-time WebGL inspection' },
      { name: 'Floor-to-Ceiling Thermal Glass', icon: 'Sparkles', desc: 'UV & acoustic insulation' },
      { name: 'Bank-Grade Clear Title', icon: 'ShieldCheck', desc: '100% verified registry deeds' },
      { name: 'Private Rooftop Pavilion', icon: 'CheckCircle2', desc: 'Panoramic hillside vistas' },
    ];
  }

  const cols = content.columns === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="py-12 space-y-8">
      {(content.heading || content.subheading) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {content.heading && (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {content.heading}
            </h3>
          )}
          {content.subheading && (
            <p className="text-xs sm:text-sm text-slate-400 font-light">
              {content.subheading}
            </p>
          )}
        </div>
      )}

      <div className={`grid gap-5 ${cols}`}>
        {items.map((item: any, i: number) => {
          const title = typeof item === 'string' ? item : item.name || item.title || `Item ${i + 1}`;
          const desc = typeof item === 'object' ? item.desc || item.description || '' : '';
          const icon = typeof item === 'object' ? item.icon || content.itemIcon || 'CheckCircle2' : 'CheckCircle2';

          return (
            <motion.div
              key={i}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="p-5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-2xl flex items-start space-x-3.5 transition-colors"
            >
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl mt-0.5">
                <DynamicCmsIcon name={icon} className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-bold text-white">{title}</h4>
                {desc && <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// 14. Interactive Gallery Block with Lightbox
const GalleryBlock = ({ content }: { content: any }) => {
  const images: string[] = Array.isArray(content.images) && content.images.length > 0
    ? content.images
    : [
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ];

  const [activeLightbox, setActiveLightbox] = useState<string | null>(null);

  return (
    <div className="py-12 space-y-8">
      {(content.heading || content.subheading) && (
        <div className="text-center max-w-2xl mx-auto space-y-2">
          {content.heading && (
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {content.heading}
            </h3>
          )}
          {content.subheading && (
            <p className="text-xs sm:text-sm text-slate-400 font-light">
              {content.subheading}
            </p>
          )}
        </div>
      )}

      {/* Grid of gallery images */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {images.map((imgUrl, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveLightbox(imgUrl)}
            className="group relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 aspect-[4/3] cursor-pointer shadow-lg"
          >
            <img
              src={imgUrl}
              alt={`Gallery Image ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-xl text-xs text-white font-medium border border-white/20">
                View High-Res
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveLightbox(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8"
          >
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeLightbox}
              alt="High-Res Inspection"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
