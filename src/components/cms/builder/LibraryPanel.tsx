'use client';

import React, { useState, useMemo } from 'react';
import { SectionDefinition, SectionCategory } from '@/lib/cms/sdk/types';
import { SECTION_LIBRARY, searchSections } from '@/lib/cms/sdk/sectionLibrary';
import {
  Layers,
  Component,
  Sparkles,
  Search,
  Plus,
  Compass,
  Grid,
  Box,
  CheckCircle2,
  ChevronRight,
  GripVertical,
} from 'lucide-react';

interface LibraryPanelProps {
  onAddSection: (definition: SectionDefinition) => void;
  availableVariables?: Array<{ key: string; label: string; type: string; category: string }>;
}

const CATEGORIES: Array<SectionCategory | 'All'> = [
  'All',
  'Hero',
  'Property Listings',
  'Property Detail',
  '3D',
  'Features',
  'Amenities',
  'Gallery',
  'Scroll Story',
  'Stats',
  'Testimonials',
  'CTA',
  'Forms',
  'Agents',
  'Neighborhood',
  'Floor Plans',
  'FAQ',
  'Timeline',
  'Comparison',
  'Logos',
];

const PRIMITIVE_ITEMS = [
  { type: 'Container', label: 'Layout Container', icon: 'Box', desc: 'Centered maximum-width wrapper' },
  { type: 'Heading', label: 'Semantic Heading', icon: 'Sparkles', desc: 'Title h1–h6 with typography tokens' },
  { type: 'Text', label: 'Paragraph / Body', icon: 'Layers', desc: 'Rich body text with variable chips' },
  { type: 'Image', label: 'Responsive Image', icon: 'Grid', desc: 'Auto-scaled photo with lazy loading' },
  { type: 'Button', label: 'Action Button', icon: 'Compass', desc: 'CTA button linked to actions' },
  { type: 'Card', label: 'Glassmorphic Card', icon: 'Box', desc: 'Elevated surface with hover lift' },
  { type: 'Grid', label: 'Responsive Grid', icon: 'Grid', desc: '1 to 6 column flexible grid' },
  { type: 'Form', label: 'Lead Capture Form', icon: 'CheckCircle2', desc: 'Interactive form with CRM dispatch' },
  { type: 'PlayCanvasViewer', label: '3D Spatial Viewer', icon: 'Compass', desc: 'Embedded WebGL 3D architectural tour' },
];

export const LibraryPanel: React.FC<LibraryPanelProps> = ({
  onAddSection,
  availableVariables = [
    { key: 'property.title', label: 'Property Title', type: 'string', category: 'Property' },
    { key: 'property.price', label: 'Price Amount', type: 'number', category: 'Property' },
    { key: 'property.location.city', label: 'City Precinct', type: 'string', category: 'Property' },
    { key: 'property.specs.bedrooms', label: 'Bedrooms', type: 'number', category: 'Property' },
    { key: 'property.specs.areaSqFt', label: 'Square Footage', type: 'number', category: 'Property' },
    { key: 'property.amenities', label: 'Amenities List', type: 'array', category: 'Property' },
    { key: 'brand.name', label: 'Agency Brand Name', type: 'string', category: 'Website' },
    { key: 'site.contactPhone', label: 'Support Telephone', type: 'string', category: 'Website' },
  ],
}) => {
  const [activeTab, setActiveTab] = useState<'sections' | 'primitives' | 'variables'>('sections');
  const [selectedCategory, setSelectedCategory] = useState<SectionCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    const cat = selectedCategory === 'All' ? undefined : selectedCategory;
    return searchSections(searchQuery, cat);
  }, [searchQuery, selectedCategory]);

  return (
    <aside className="w-80 border-r border-white/10 bg-[#0d121f] flex flex-col h-full select-none z-20">
      {/* Top Tabs */}
      <div className="flex border-b border-white/10 p-2 gap-1 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setActiveTab('sections')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'sections' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Sections</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('primitives')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'primitives' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Component className="w-3.5 h-3.5" />
          <span>Primitives</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('variables')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'variables' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Variables</span>
        </button>
      </div>

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search 150+ sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter Pills (Horizontal Scroll) */}
          <div className="px-3 py-2 border-b border-white/5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Section Definition List (Virtualized/Scrollable) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-1">
              <span>{filteredSections.length} templates available</span>
              <span>Click + to add</span>
            </div>

            {filteredSections.map((def) => (
              <div
                key={def.key}
                className="p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-blue-500/30 rounded-xl transition-all group space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      {def.metadata.category}
                    </span>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                      {def.metadata.name}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddSection(def)}
                    title="Add to Canvas"
                    className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md transition-all hover:scale-110 flex-shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                {def.metadata.description && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {def.metadata.description}
                  </p>
                )}
                {def.metadata.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {def.metadata.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-slate-500 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primitives Tab */}
      {activeTab === 'primitives' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
          <p className="text-[11px] text-slate-400 px-1 py-1">
            Core building blocks used across all standard and custom Section SDK templates.
          </p>
          {PRIMITIVE_ITEMS.map((item) => (
            <div
              key={item.type}
              className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{item.label}</span>
                <span className="text-[10px] font-mono text-blue-400">{item.type}</span>
              </div>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* Variables Tab */}
      {activeTab === 'variables' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Dynamic Variable Dictionary
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Discovered model fields ready for dynamic binding and structured token chips.
            </p>
          </div>

          <div className="space-y-1.5">
            {availableVariables.map((v) => (
              <div
                key={v.key}
                className="p-2 bg-white/[0.02] border border-white/10 rounded-lg flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-[11px] text-blue-300 block">{v.key}</span>
                  <span className="text-[10px] text-slate-400">{v.label}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">
                  {v.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
