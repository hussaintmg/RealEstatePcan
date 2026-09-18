'use client';

import React, { useState } from 'react';
import { SectionInstance, SectionDefinition, ConditionRule, ConditionOperator } from '@/lib/cms/sdk/types';
import { VariableChipEditor } from './VariableChipEditor';
import {
  Sliders,
  Palette,
  Database,
  Filter,
  Activity,
  Smartphone,
  Plus,
  Trash2,
  Settings2,
  Sparkles,
  Info,
} from 'lucide-react';

interface InspectorPanelProps {
  selectedSection: SectionInstance | null;
  definition?: SectionDefinition;
  onUpdateSection: (updated: SectionInstance) => void;
  pageSettings?: {
    title: string;
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
  };
  onUpdatePageSettings?: (settings: any) => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedSection,
  definition,
  onUpdateSection,
  pageSettings,
  onUpdatePageSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'content' | 'design' | 'data' | 'conditions' | 'animation' | 'responsive'>('content');

  // If no section is selected, render Page-Level Inspector
  if (!selectedSection) {
    return (
      <aside className="w-80 border-l border-white/10 bg-[#0d121f] flex flex-col h-full select-none text-xs z-20">
        <div className="p-4 border-b border-white/10 flex items-center space-x-2">
          <Settings2 className="w-4 h-4 text-blue-400" />
          <h3 className="font-bold text-white text-sm">Page Settings & SEO</h3>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Page Title</label>
            <input
              type="text"
              value={pageSettings?.title || ''}
              onChange={(e) => onUpdatePageSettings?.({ ...pageSettings, title: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">URL Route Slug</label>
            <input
              type="text"
              value={pageSettings?.slug || ''}
              onChange={(e) => onUpdatePageSettings?.({ ...pageSettings, slug: e.target.value })}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Meta Title (SEO)</label>
            <input
              type="text"
              value={pageSettings?.metaTitle || ''}
              onChange={(e) => onUpdatePageSettings?.({ ...pageSettings, metaTitle: e.target.value })}
              placeholder="e.g. Signature Estates | Luxury Residences"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Meta Description</label>
            <textarea
              rows={3}
              value={pageSettings?.metaDescription || ''}
              onChange={(e) => onUpdatePageSettings?.({ ...pageSettings, metaDescription: e.target.value })}
              placeholder="Brief summary for Google search snippets..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Search Preview</span>
            <div className="space-y-0.5">
              <span className="text-blue-400 font-semibold text-xs truncate block">
                {pageSettings?.metaTitle || pageSettings?.title || 'Page Title'}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono block">
                https://auraheights.com/{pageSettings?.slug}
              </span>
              <p className="text-[10px] text-slate-400 line-clamp-2">
                {pageSettings?.metaDescription || 'No description provided.'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Section Props & Style updates
  const updateProp = (key: string, value: any) => {
    const updated = {
      ...selectedSection,
      props: {
        ...(selectedSection.props || {}),
        [key]: value,
      },
    };
    onUpdateSection(updated);
  };

  const updateStyle = (key: string, value: any) => {
    const updated = {
      ...selectedSection,
      styles: {
        ...(selectedSection.styles || {}),
        [key]: value,
      },
    };
    onUpdateSection(updated);
  };

  const updateAnimation = (key: string, value: any) => {
    const updated = {
      ...selectedSection,
      animation: {
        ...(selectedSection.animation || {}),
        [key]: value,
      },
    };
    onUpdateSection(updated);
  };

  const addCondition = () => {
    const newRule: ConditionRule = {
      field: 'property.status',
      operator: 'equals',
      value: 'available',
      logic: 'AND',
    };
    const updated = {
      ...selectedSection,
      conditions: [...(selectedSection.conditions || []), newRule],
    };
    onUpdateSection(updated);
  };

  const removeCondition = (index: number) => {
    const updated = {
      ...selectedSection,
      conditions: (selectedSection.conditions || []).filter((_, i) => i !== index),
    };
    onUpdateSection(updated);
  };

  const updateConditionRule = (index: number, patch: Partial<ConditionRule>) => {
    const rules = [...(selectedSection.conditions || [])];
    rules[index] = { ...rules[index], ...patch };
    onUpdateSection({ ...selectedSection, conditions: rules });
  };

  const propsSchema = definition?.propsSchema || [];

  return (
    <aside className="w-80 border-l border-white/10 bg-[#0d121f] flex flex-col h-full select-none text-xs z-20">
      {/* Section Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
            {definition?.metadata.category || 'Section'}
          </span>
          <h3 className="font-bold text-white text-xs truncate max-w-[180px]">
            {selectedSection.title || definition?.metadata.name}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          v{selectedSection.sectionVersion}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 p-1.5 gap-1 bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'content' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Content
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('design')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'design' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Design
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('conditions')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'conditions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Rules
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('animation')}
          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
            activeTab === 'animation' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Motion
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            {propsSchema.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">No editable properties declared for this section.</p>
            ) : (
              propsSchema.map((field) => {
                const curVal = selectedSection.props?.[field.key] ?? field.defaultValue ?? '';

                if (field.type === 'string' || field.type === 'richText') {
                  return (
                    <div key={field.key} className="space-y-1">
                      <label className="block text-slate-300 font-semibold text-[11px]">{field.label}</label>
                      <VariableChipEditor
                        value={curVal}
                        onChange={(str) => updateProp(field.key, str)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                      />
                    </div>
                  );
                }

                if (field.type === 'number') {
                  return (
                    <div key={field.key}>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px]">{field.label}</label>
                      <input
                        type="number"
                        value={curVal}
                        onChange={(e) => updateProp(field.key, Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                }

                if (field.type === 'boolean') {
                  return (
                    <div key={field.key} className="flex items-center justify-between p-2 bg-white/[0.02] border border-white/10 rounded-xl">
                      <span className="font-semibold text-white text-[11px]">{field.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(curVal)}
                        onChange={(e) => updateProp(field.key, e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 bg-white/5 border-white/10"
                      />
                    </div>
                  );
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.key}>
                      <label className="block text-slate-300 font-semibold mb-1 text-[11px]">{field.label}</label>
                      <select
                        value={curVal}
                        onChange={(e) => updateProp(field.key, e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                      >
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="block text-slate-300 font-semibold mb-1 text-[11px]">{field.label}</label>
                    <input
                      type="text"
                      value={curVal}
                      onChange={(e) => updateProp(field.key, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Design Tab (Module 6 tokens) */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Background Color</label>
              <input
                type="text"
                value={selectedSection.styles?.backgroundColor || ''}
                placeholder="transparent or rgba(16, 21, 34, 0.9)"
                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Vertical Padding</label>
              <select
                value={selectedSection.styles?.padding || '4rem'}
                onChange={(e) => updateStyle('padding', e.target.value)}
                className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white"
              >
                <option value="1rem">Compact (1rem / 16px)</option>
                <option value="2.5rem">Medium (2.5rem / 40px)</option>
                <option value="4rem">Standard (4rem / 64px)</option>
                <option value="6rem">Spacious (6rem / 96px)</option>
                <option value="8rem">Grand Architectural (8rem / 128px)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Maximum Container Width</label>
              <select
                value={selectedSection.styles?.maxWidth || '1280px'}
                onChange={(e) => updateStyle('maxWidth', e.target.value)}
                className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white"
              >
                <option value="1024px">Standard (1024px)</option>
                <option value="1280px">Wide (1280px)</option>
                <option value="1440px">Extra Wide (1440px)</option>
                <option value="100%">Full Bleed (100%)</option>
              </select>
            </div>
          </div>
        )}

        {/* Conditions Rules Tab */}
        {activeTab === 'conditions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-[11px]">Visibility Rules</span>
              <button
                type="button"
                onClick={addCondition}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-semibold"
              >
                <Plus className="w-3 h-3" />
                <span>Add Rule</span>
              </button>
            </div>

            {(!selectedSection.conditions || selectedSection.conditions.length === 0) ? (
              <p className="text-slate-500 italic text-[11px]">Always visible. No conditions applied.</p>
            ) : (
              <div className="space-y-3">
                {selectedSection.conditions.map((cond, i) => (
                  <div key={i} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-400 font-mono font-bold">Rule #{i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeCondition(i)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Field (e.g. property.status)"
                      value={cond.field}
                      onChange={(e) => updateConditionRule(i, { field: e.target.value })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-[11px]"
                    />

                    <select
                      value={cond.operator}
                      onChange={(e) => updateConditionRule(i, { operator: e.target.value as ConditionOperator })}
                      className="w-full px-2 py-1 bg-[#101522] border border-white/10 rounded-lg text-white text-[11px]"
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">not equals</option>
                      <option value="contains">contains</option>
                      <option value="exists">exists</option>
                      <option value="greater_than">greater than</option>
                      <option value="less_than">less than</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Comparison value"
                      value={cond.value}
                      onChange={(e) => updateConditionRule(i, { value: e.target.value })}
                      className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-[11px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Motion Tab */}
        {activeTab === 'animation' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Entrance Animation</label>
              <select
                value={selectedSection.animation?.type || 'fade'}
                onChange={(e) => updateAnimation('type', e.target.value)}
                className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white"
              >
                <option value="none">None (Static)</option>
                <option value="fade">Fade In</option>
                <option value="slide_up">Slide Up</option>
                <option value="scale">Scale Reveal</option>
                <option value="reveal">Blur Reveal</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 text-[11px]">Hover Effect</label>
              <select
                value={selectedSection.animation?.hoverEffect || 'none'}
                onChange={(e) => updateAnimation('hoverEffect', e.target.value)}
                className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white"
              >
                <option value="none">None</option>
                <option value="lift">Lift (-4px)</option>
                <option value="scale">Subtle Zoom (1.01x)</option>
                <option value="glow">Cyan Ambient Glow</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
