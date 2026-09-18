'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SectionInstance, SectionDefinition } from '@/lib/cms/sdk/types';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { useBuilderHistory } from '@/components/cms/builder/useBuilderHistory';
import { BuilderToolbar, Breakpoint } from '@/components/cms/builder/BuilderToolbar';
import { LibraryPanel } from '@/components/cms/builder/LibraryPanel';
import { BuilderCanvas } from '@/components/cms/builder/BuilderCanvas';
import { InspectorPanel } from '@/components/cms/builder/InspectorPanel';
import { Loader2, History, RotateCcw, X, CheckCircle2 } from 'lucide-react';

export default function PageBuilderApp() {
  const { id } = useParams();
  const pageId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<any>(null);
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Version History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // History & Sections State
  const {
    sections,
    setSections,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
  } = useBuilderHistory([]);

  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Page Fetch
  useEffect(() => {
    if (!pageId) return;

    fetch(`/api/cms/pages/${pageId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.page) {
          setPage(data.page);
          const initialSections = (data.page.sections || []).map((s: any) => ({
            id: s.id || `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            sectionKey: s.sectionKey || s.type || 'hero_cinematic',
            sectionVersion: s.sectionVersion || '1.0.0',
            title: s.title || '',
            order: s.order || 0,
            isVisible: s.isVisible !== false,
            props: s.props || s.content || {},
            styles: s.styles || s.design || {},
            conditions: s.conditions || [],
            animation: s.animation || {},
          }));
          resetHistory(initialSections);
          setHistoryList(data.page.versionHistory || []);
        }
      })
      .catch((err) => console.error('Failed to load page:', err))
      .finally(() => setLoading(false));
  }, [pageId, resetHistory]);

  // 2. Debounced Autosave Function
  const persistDraft = useCallback(
    async (currentSections: SectionInstance[]) => {
      if (!pageId || !page) return;
      setSaveStatus('saving');

      try {
        const res = await fetch(`/api/cms/pages/${pageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: currentSections,
            title: page.title,
            slug: page.slug,
            seo: page.seo,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (err) {
        setSaveStatus('error');
      }
    },
    [pageId, page]
  );

  // Trigger autosave with 1500ms debounce whenever sections change
  const handleSectionsChange = useCallback(
    (newSections: SectionInstance[], coalesce = false) => {
      setSections(newSections, coalesce);
      setSaveStatus('unsaved');

      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }

      autosaveTimeoutRef.current = setTimeout(() => {
        persistDraft(newSections);
      }, 1500);
    },
    [persistDraft, setSections]
  );

  // Section Operations
  const handleAddSection = (definition: SectionDefinition) => {
    const newInstance: SectionInstance = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionKey: definition.key,
      sectionVersion: definition.version,
      title: definition.metadata.name,
      order: sections.length + 1,
      isVisible: true,
      props: { ...definition.defaultProps },
      styles: {},
      conditions: [],
      animation: { type: 'fade', duration: 0.5 },
    };

    const updated = [...sections, newInstance];
    handleSectionsChange(updated);
    setSelectedSectionId(newInstance.id);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const updated = [...sections];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    // update order indices
    const normalized = updated.map((sec, i) => ({ ...sec, order: i + 1 }));
    handleSectionsChange(normalized);
  };

  const handleDuplicate = (id: string) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return;
    const cloned: SectionInstance = {
      ...target,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${target.title || 'Section'} (Copy)`,
      order: sections.length + 1,
    };
    handleSectionsChange([...sections, cloned]);
    setSelectedSectionId(cloned.id);
  };

  const handleToggleVisibility = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s));
    handleSectionsChange(updated);
  };

  const handleToggleLock = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isLocked: !s.isLocked } : s));
    handleSectionsChange(updated);
  };

  const handleDelete = (id: string) => {
    const updated = sections.filter((s) => s.id !== id);
    handleSectionsChange(updated);
    if (selectedSectionId === id) {
      setSelectedSectionId(null);
    }
  };

  const handleUpdateSelectedSection = (updated: SectionInstance) => {
    const nextSections = sections.map((s) => (s.id === updated.id ? updated : s));
    handleSectionsChange(nextSections, true);
  };

  const handlePublishLive = async () => {
    if (!pageId) return;
    setIsPublishing(true);

    try {
      const res = await fetch(`/api/cms/pages/${pageId}/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('saved');
        setPage((prev: any) => ({ ...prev, version: data.page.version, status: 'published' }));
        alert(`Page published atomically! Live version: v${data.page.version}`);
      } else {
        alert(`Publish failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (!window.confirm(`Roll back public page to version v${targetVersion}?`)) return;

    try {
      const res = await fetch(`/api/cms/pages/${pageId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Rollback error:', err);
    }
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+S)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo) redo();
        } else {
          if (canUndo) undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        persistDraft(sections);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canUndo, canRedo, undo, redo, persistDraft, sections]);

  if (loading || !page) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-xs uppercase tracking-wider font-semibold">Loading Page Builder Studio...</span>
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.id === selectedSectionId) || null;
  const selectedDefinition = selectedSection ? getSectionDefinition(selectedSection.sectionKey) : undefined;

  return (
    <div className="h-screen w-screen bg-[#070a0f] text-white flex flex-col overflow-hidden">
      {/* 1. Builder Toolbar */}
      <BuilderToolbar
        pageTitle={page.title}
        saveStatus={saveStatus}
        breakpoint={breakpoint}
        onBreakpointChange={setBreakpoint}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isPreview={isPreview}
        onTogglePreview={() => setIsPreview(!isPreview)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onSaveDraft={() => persistDraft(sections)}
        onPublish={handlePublishLive}
        isPublishing={isPublishing}
      />

      {/* 2. Main Studio Work Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Library Panel (hidden in preview mode) */}
        {!isPreview && <LibraryPanel onAddSection={handleAddSection} />}

        {/* Center Canvas */}
        <BuilderCanvas
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelectSection={setSelectedSectionId}
          onReorder={handleReorder}
          onDuplicate={handleDuplicate}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onDelete={handleDelete}
          breakpoint={breakpoint}
          isPreview={isPreview}
        />

        {/* Right Inspector Panel (hidden in preview mode) */}
        {!isPreview && (
          <InspectorPanel
            selectedSection={selectedSection}
            definition={selectedDefinition}
            onUpdateSection={handleUpdateSelectedSection}
            pageSettings={{
              title: page.title,
              slug: page.slug,
              metaTitle: page.seo?.metaTitle,
              metaDescription: page.seo?.metaDescription,
            }}
            onUpdatePageSettings={(settings) => {
              setPage((prev: any) => ({ ...prev, ...settings }));
              setSaveStatus('unsaved');
            }}
          />
        )}
      </div>

      {/* Version History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d121f] border border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <History className="w-4 h-4 text-blue-400" />
                <span>Page Version History</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {historyList.length === 0 ? (
                <p className="text-slate-500 italic py-4 text-center">No previous published versions recorded yet.</p>
              ) : (
                historyList.map((hist) => (
                  <div key={hist.version} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">Version v{hist.version}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Published on {new Date(hist.publishedAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRollback(hist.version)}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg flex items-center space-x-1"
                    >
                      <RotateCcw className="w-3 h-3 text-blue-400" />
                      <span>Rollback</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
