'use client';

import React from 'react';
import { TwoWayTemplateEditor } from '@/components/templates/TwoWayTemplateEditor';
import { FileCode, Sparkles } from 'lucide-react';

export default function TemplatesStudioPage() {
  const handleSaveTemplate = async (templateData: any) => {
    await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `${templateData.type.toUpperCase()} Booking & Invoice Confirmation`,
        ...templateData,
      }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-white/10 pb-5">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <FileCode className="w-4 h-4" />
          <span>Dynamic Communications Engine</span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Visual Template Studio (PDF, Email, &amp; WhatsApp)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Dual-tab real-time sync editor with Ababeel floating variable picker and automated PDF attachment generation.
        </p>
      </div>

      <TwoWayTemplateEditor
        onSave={handleSaveTemplate}
        availablePdfTemplates={[
          { id: 'sample-pdf-1', name: 'Official Villa Reservation Agreement (PDF)' },
          { id: 'sample-pdf-2', name: 'Verified Escrow Payment Receipt (PDF)' },
        ]}
      />
    </div>
  );
}
