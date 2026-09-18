'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SectionDefinition, PrimitiveNode, PropFieldDefinition } from '@/lib/cms/sdk/types';
import { UniversalSectionRenderer } from '@/lib/cms/sdk/UniversalSectionRenderer';
import { exportSectionPackage } from '@/lib/cms/packageManager';
import {
  Sparkles,
  ArrowLeft,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Box,
} from 'lucide-react';

export default function SectionStudioPage() {
  const [key, setKey] = useState('custom_hero_banner');
  const [version, setVersion] = useState('1.0.0');
  const [name, setName] = useState('Custom Showcase Banner');
  const [category, setCategory] = useState('Hero');
  const [description, setDescription] = useState('Architectural showcase banner with dual buttons');

  // Declarative Primitive AST layout
  const [layoutTree, setLayoutTree] = useState<PrimitiveNode>({
    id: 'custom-root',
    type: 'Container',
    props: {},
    styles: {
      padding: '4rem 1.5rem',
      backgroundColor: 'rgba(16, 21, 34, 0.85)',
      borderRadius: '1.5rem',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center',
    },
    children: [
      {
        id: 'c-badge',
        type: 'Badge',
        props: { label: 'Signature Release', icon: 'Sparkles' },
      },
      {
        id: 'c-heading',
        type: 'Heading',
        props: { level: 'h2', text: '{{props.heading}}' },
        styles: { margin: '1rem 0' },
      },
      {
        id: 'c-text',
        type: 'Text',
        props: { text: '{{props.description}}' },
      },
      {
        id: 'c-btn',
        type: 'Button',
        props: { text: '{{props.buttonText}}', variant: 'primary', action: { type: 'navigate', target: '/properties' } },
        styles: { margin: '1.5rem 0 0 0' },
      },
    ],
  });

  // Editable Props Schema
  const [propsSchema, setPropsSchema] = useState<PropFieldDefinition[]>([
    { key: 'heading', label: 'Heading Title', type: 'string', defaultValue: 'Handcrafted Modern Sanctuaries' },
    { key: 'description', label: 'Description Text', type: 'richText', defaultValue: 'Explore bespoke hillside residences sculpted with Italian travertine and glass.' },
    { key: 'buttonText', label: 'Button Label', type: 'string', defaultValue: 'Explore Estates' },
  ]);

  const [defaultProps, setDefaultProps] = useState<Record<string, any>>({
    heading: 'Handcrafted Modern Sanctuaries',
    description: 'Explore bespoke hillside residences sculpted with Italian travertine and glass.',
    buttonText: 'Explore Estates',
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const currentDefinition: SectionDefinition = {
    key,
    version,
    metadata: {
      key,
      version,
      name,
      category: category as any,
      description,
      author: 'Studio User',
      source: 'developer',
      tags: ['custom', category.toLowerCase()],
    },
    propsSchema,
    defaultProps,
    layoutTree,
  };

  const handleSaveAndRegister = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/cms/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentDefinition),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: `Section [${name}] registered successfully!`, isError: false });
      } else {
        setMessage({ text: data.error || 'Registration failed', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    } finally {
      setSaving(false);
    }
  };

  const handleExportPackage = () => {
    const jsonStr = exportSectionPackage(currentDefinition);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}-v${version}.section.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPackage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await fetch('/api/cms/sections/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageJson: text }),
      });
      const data = await res.json();
      if (data.success && data.section) {
        setKey(data.section.key);
        setVersion(data.section.version);
        setName(data.section.name);
        setCategory(data.section.category);
        setDescription(data.section.description || '');
        setLayoutTree(data.section.layoutTree);
        setPropsSchema(data.section.propsSchema || []);
        setDefaultProps(data.section.defaultProps || {});
        setMessage({ text: `Imported and registered "${data.section.name}"!`, isError: false });
      } else {
        setMessage({ text: data.error || 'Import failed', isError: true });
      }
    } catch (err: any) {
      setMessage({ text: err.message, isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-[#0d121f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/website/cms/pages"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h1 className="text-sm font-bold text-white tracking-wide">Section Studio</h1>
            </div>
            <p className="text-[10px] text-slate-400">Declarative Section SDK Builder & Package Exporter</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Export Package */}
          <button
            type="button"
            onClick={handleExportPackage}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Package</span>
          </button>

          {/* Import Package */}
          <label className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Package</span>
            <input type="file" accept=".json" onChange={handleImportPackage} className="hidden" />
          </label>

          {/* Save & Register */}
          <button
            type="button"
            onClick={handleSaveAndRegister}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Register</span>
          </button>
        </div>
      </header>

      {message && (
        <div
          className={`p-3 text-xs flex items-center justify-center space-x-2 ${
            message.isError ? 'bg-rose-500/10 text-rose-300 border-b border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border-b border-emerald-500/20'
          }`}
        >
          {message.isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Studio Inspector */}
        <div className="w-full lg:w-96 border-r border-white/10 bg-[#0d121f] p-5 overflow-y-auto space-y-6 text-xs">
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              1. Section Metadata
            </span>
            <div>
              <label className="block text-slate-400 mb-1">Unique Key</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#101522] border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="Hero">Hero</option>
                  <option value="Features">Features</option>
                  <option value="Property Listings">Property Listings</option>
                  <option value="CTA">CTA</option>
                  <option value="Testimonials">Testimonials</option>
                  <option value="Forms">Forms</option>
                </select>
              </div>
            </div>
          </div>

          {/* Editable Props Schema */}
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              2. Editable Props Schema
            </span>
            <div className="space-y-2">
              {propsSchema.map((field, i) => (
                <div key={field.key} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono">{field.key}</span>
                    <span className="text-[10px] text-blue-400">{field.type}</span>
                  </div>
                  <input
                    type="text"
                    value={defaultProps[field.key] || ''}
                    onChange={(e) => setDefaultProps({ ...defaultProps, [field.key]: e.target.value })}
                    placeholder="Default preview value"
                    className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Preview Canvas */}
        <div className="flex-1 bg-[#05070b] p-6 overflow-y-auto flex flex-col justify-center items-center">
          <div className="w-full max-w-4xl bg-[#0a0d14] rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-bold text-blue-400 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Declarative Section Preview</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Category: {category}</span>
            </div>

            <UniversalSectionRenderer
              section={{
                id: 'studio-preview-instance',
                sectionKey: key,
                sectionVersion: version,
                title: name,
                order: 1,
                isVisible: true,
                props: defaultProps,
              }}
              definition={currentDefinition}
              dataContext={{ props: defaultProps }}
              isEditing={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
