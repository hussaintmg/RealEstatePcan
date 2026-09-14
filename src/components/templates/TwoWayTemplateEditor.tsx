'use client';

import React, { useState, useEffect } from 'react';
import { DraggableVariableModal } from '@/components/cms/DraggableVariableModal';
import {
  Code2,
  Layout,
  Eye,
  FileText,
  Mail,
  MessageSquare,
  Paperclip,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';

interface TwoWayTemplateEditorProps {
  initialType?: 'pdf' | 'email' | 'whatsapp';
  initialHtml?: string;
  initialCss?: string;
  initialSubject?: string;
  availablePdfTemplates?: { id: string; name: string }[];
  onSave: (data: {
    type: string;
    subject?: string;
    contentHtml: string;
    cssStyles: string;
    attachedPdfTemplateId?: string;
  }) => Promise<void>;
}

export const TwoWayTemplateEditor: React.FC<TwoWayTemplateEditorProps> = ({
  initialType = 'pdf',
  initialHtml = `
<div class="template-card">
  <h1>Luxury Villa Booking Confirmation</h1>
  <p>Dear <strong>{{customer.fullName}}</strong>,</p>
  <p>Congratulations on reserving <strong>{{property.title}}</strong> in {{property.location.city}}.</p>
  
  <div class="specs-grid">
    <div><strong>Bedrooms:</strong> {{property.specs.bedrooms}}</div>
    <div><strong>Area:</strong> {{property.specs.areaSqFt}} sq ft</div>
    <div><strong>Total Price:</strong> \${{property.price}}</div>
  </div>

  <h3>Payment Milestones</h3>
  <table class="milestone-table">
    <thead>
      <tr><th>Milestone</th><th>Amount</th></tr>
    </thead>
    <tbody>
      {{#each invoice.milestones}}
      <tr><td>{{this.name}}</td><td>\${{this.amount}}</td></tr>
      {{/each}}
    </tbody>
  </table>

  <p class="footer">Thank you for choosing {{agency.name}}. Official WhatsApp: {{agency.supportPhone}}</p>
</div>
`.trim(),
  initialCss = `
.template-card {
  font-family: 'Segoe UI', Arial, sans-serif;
  max-width: 650px;
  margin: 20px auto;
  padding: 30px;
  background: #ffffff;
  color: #1a202c;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}
h1 { color: #1e3a8a; font-size: 24px; margin-bottom: 12px; }
.specs-grid { display: flex; gap: 20px; margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 14px; }
.milestone-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.milestone-table th, .milestone-table td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
.milestone-table th { background: #f1f5f9; color: #334155; }
.footer { margin-top: 24px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
`.trim(),
  initialSubject = 'Your Property Reservation Documents & Invoice',
  availablePdfTemplates = [],
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'designer' | 'code'>('designer');
  const [type, setType] = useState<'pdf' | 'email' | 'whatsapp'>(initialType);
  const [subject, setSubject] = useState(initialSubject);
  const [contentHtml, setContentHtml] = useState(initialHtml);
  const [cssStyles, setCssStyles] = useState(initialCss);
  const [attachedPdfTemplateId, setAttachedPdfTemplateId] = useState<string>('');

  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleInsertVariable = (token: string) => {
    setContentHtml((prev) => `${prev} ${token}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        type,
        subject: type === 'email' ? subject : undefined,
        contentHtml,
        cssStyles,
        attachedPdfTemplateId: type !== 'pdf' && attachedPdfTemplateId ? attachedPdfTemplateId : undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Compile combined preview HTML
  const fullPreviewHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 16px; background: transparent; }
          ${cssStyles}
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `;

  return (
    <div className="w-full space-y-4">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white/[0.03] border border-white/10 rounded-2xl">
        <div className="flex items-center space-x-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setType('pdf')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                type === 'pdf' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Template</span>
            </button>
            <button
              onClick={() => setType('email')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                type === 'email' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Template</span>
            </button>
            <button
              onClick={() => setType('whatsapp')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                type === 'whatsapp' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Template</span>
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('designer')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'designer' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Visual Designer</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>HTML & CSS Code</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsVariableModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-medium transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Insert Dynamic Variables</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? 'Saved!' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Email Subject / PDF Attachment Options */}
      {type === 'email' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Email Subject (with variables):</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. {{agency.name}} - Booking Confirmation for {{property.title}}"
              className="w-full text-xs text-white bg-black/30 border border-white/10 rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              Auto-Attach Rendered PDF Template:
            </label>
            <select
              value={attachedPdfTemplateId}
              onChange={(e) => setAttachedPdfTemplateId(e.target.value)}
              className="w-full text-xs text-white bg-black/30 border border-white/10 rounded-lg px-3 py-2"
            >
              <option value="">None (No PDF attachment)</option>
              {availablePdfTemplates.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Editor Main Canvas (Visual Preview vs HTML/CSS Editor) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[580px]">
        {/* Left Side: Code Editor (or Visual Controls) */}
        <div className="flex flex-col bg-[#0a0d14] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs font-semibold text-slate-300">
            <span>{activeTab === 'code' ? 'HTML Markup & Embedded CSS' : 'Markup Source'}</span>
            <span className="text-[10px] text-slate-500">2-Way Live Sync Active</span>
          </div>

          <div className="flex-1 flex flex-col p-3 space-y-2 overflow-y-auto">
            <div className="flex-1 flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                HTML Content:
              </span>
              <textarea
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                placeholder="<div>Write template HTML here...</div>"
                className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 resize-none outline-none focus:border-blue-500/50"
              />
            </div>

            <div className="h-44 flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1">
                Custom CSS Styles:
              </span>
              <textarea
                value={cssStyles}
                onChange={(e) => setCssStyles(e.target.value)}
                placeholder="/* CSS rules here */"
                className="flex-1 w-full bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 resize-none outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Live Visual Preview */}
        <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs font-semibold text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Visual Preview</span>
            </span>
            <span className="text-[10px] text-slate-400">{type.toUpperCase()} View</span>
          </div>

          <div className="flex-1 p-4 bg-slate-900/60 overflow-y-auto flex items-center justify-center">
            <iframe
              srcDoc={fullPreviewHtml}
              title="Template Preview"
              className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Draggable Variable Picker Modal */}
      <DraggableVariableModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        onInsertVariable={handleInsertVariable}
      />
    </div>
  );
};
