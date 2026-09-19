'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicCmsTopbar } from '@/components/navigation/DynamicCmsTopbar';
import { DynamicCmsNavbar } from '@/components/navigation/DynamicCmsNavbar';
import { DynamicCmsFooter } from '@/components/navigation/DynamicCmsFooter';
import { CmsSectionRenderer } from '@/components/cms/CmsSectionRenderer';
import { UniversalSectionRenderer } from '@/lib/cms/sdk/UniversalSectionRenderer';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { PropertyComparisonDrawer, ComparisonProperty } from '@/components/properties/PropertyComparisonDrawer';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { ICmsSection } from '@/models/CmsPage';
import { Bot, X, Send, Loader2 } from 'lucide-react';

const DEFAULT_SECTIONS: ICmsSection[] = [
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
];

export default function HomePage() {
  const { isAllowed } = useFeatureFlags();

  // CMS Page & Theme State
  const [cmsPage, setCmsPage] = useState<any>(null);
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Property Comparison Drawer State
  const [comparisonList, setComparisonList] = useState<ComparisonProperty[]>([]);

  // AI Chat Assistant State
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Property Advisor. How can I assist you with luxury listings, 3D PlayCanvas walkthroughs, or investment insights today?',
    },
  ]);

  useEffect(() => {
    // 1. Fetch CMS Page for slug 'home'
    fetch('/api/cms/pages?slug=home')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.page) {
          setCmsPage(data.page);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch Active Brand / Theme
    fetch('/api/cms/theme')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.theme) {
          setTheme(data.theme);
        }
      })
      .catch(() => {});
  }, []);

  // Comparison toggle handler
  const handleCompareToggle = (prop: any) => {
    setComparisonList((prev) => {
      const exists = prev.some((p) => p._id === prop._id);
      if (exists) return prev.filter((p) => p._id !== prop._id);
      if (prev.length >= 3) {
        alert('You can compare up to 3 properties at a time.');
        return prev;
      }
      return [...prev, prop];
    });
  };

  // AI chat send handler
  const handleAiSend = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    const userMsg = aiPrompt;
    setAiMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setAiPrompt('');
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, sessionId: 'home-visitor-session' }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        setAiMessages((prev) => [...prev, { role: 'assistant', text: data.text }]);
      } else {
        setAiMessages((prev) => [
          ...prev,
          { role: 'assistant', text: data.error || 'Sorry, I could not process your query at this moment.' },
        ]);
      }
    } catch {
      setAiMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Network connection issue. Please check your internet.' },
      ]);
    } finally {
      setAiLoading(false);
    }
  };

  // Construct Data Context for dynamic variable interpolation
  const dataContext = {
    brand: theme?.brand || {
      companyName: 'Aura Heights Luxury Estates',
      tagline: 'Architectural 3D Living Spaces',
      phone: '+92 (51) 880-9911',
      email: 'concierge@auraheights.local',
      address: 'Margalla Hillside Avenue, Sector F-7, Islamabad',
    },
    theme: theme || {},
    year: new Date().getFullYear(),
    route: { slug: 'home' },
  };

  // Determine sections to render
  const rawSections =
    cmsPage?.sections && cmsPage.sections.length > 0
      ? cmsPage.sections
      : DEFAULT_SECTIONS;

  const sortedSections = [...rawSections].sort(
    (a: any, b: any) => (a.order || 0) - (b.order || 0)
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0d14] text-white selection:bg-blue-600 selection:text-white relative">
      {/* 1. CMS Dynamic Topbar */}
      <DynamicCmsTopbar initialTheme={theme} />

      {/* 2. CMS Dynamic Navbar */}
      <DynamicCmsNavbar initialTheme={theme} />

      {/* 3. CMS Dynamic Sections */}
      <main className="flex-1 w-full space-y-4">
        {sortedSections.map((section: any) => {
          const definition = getSectionDefinition(section.sectionKey || section.type);
          if (definition || section.customTreeOverride) {
            return (
              <UniversalSectionRenderer
                key={section.id}
                section={section}
                definition={definition}
                dataContext={dataContext}
                isEditing={false}
              />
            );
          }
          return (
            <CmsSectionRenderer
              key={section.id}
              section={section}
              dataContext={dataContext}
              onCompareToggle={handleCompareToggle}
              comparisonIds={comparisonList.map((p) => p._id)}
            />
          );
        })}
      </main>

      {/* 4. Property Comparison Drawer */}
      <PropertyComparisonDrawer
        properties={comparisonList}
        onRemove={(id) => setComparisonList((prev) => prev.filter((p) => p._id !== id))}
        onClear={() => setComparisonList([])}
      />

      {/* 5. Floating AI Assistant (Gated by Developer Feature Flag) */}
      {isAllowed('aiAssistant') && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAiChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl shadow-blue-600/50 flex items-center justify-center group"
          >
            <Bot className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-xs font-semibold pl-0 group-hover:pl-2">
              Ask Real Estate AI
            </span>
          </motion.button>

          <AnimatePresence>
            {aiChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="fixed bottom-20 right-6 z-50 w-96 bg-[#101522]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px]"
              >
                <div className="flex items-center justify-between p-4 bg-white/[0.04] border-b border-white/10">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-blue-500/20 rounded-xl">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">AI Property Concierge</h4>
                      <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Multi-Failover Intelligence</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAiChatOpen(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                  {aiMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] p-3.5 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                            : 'bg-white/[0.06] text-slate-200 rounded-bl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  {aiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/[0.06] p-3 rounded-2xl rounded-bl-none border border-white/5 flex items-center space-x-2 text-slate-400 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>Thinking with failover intelligence...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="p-3 border-t border-white/10 bg-black/20 flex items-center space-x-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                    placeholder="Ask about properties, 3D tours, mortgage..."
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500/50"
                  />
                  <button
                    onClick={handleAiSend}
                    disabled={aiLoading}
                    className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* 6. CMS Dynamic Footer */}
      <DynamicCmsFooter initialTheme={theme} />
    </div>
  );
}
