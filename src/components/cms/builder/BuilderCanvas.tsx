'use client';

import React, { useState } from 'react';
import { SectionInstance, SectionDefinition } from '@/lib/cms/sdk/types';
import { UniversalSectionRenderer } from '@/lib/cms/sdk/UniversalSectionRenderer';
import { getSectionDefinition } from '@/lib/cms/sdk/sectionLibrary';
import { Breakpoint } from './BuilderToolbar';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  MoveVertical,
  Plus,
} from 'lucide-react';

interface BuilderCanvasProps {
  sections: SectionInstance[];
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  breakpoint: Breakpoint;
  isPreview: boolean;
  dataContext?: Record<string, any>;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  sections,
  selectedSectionId,
  onSelectSection,
  onReorder,
  onDuplicate,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  breakpoint,
  isPreview,
  dataContext = {},
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const containerWidths = {
    desktop: 'w-full max-w-full',
    tablet: 'w-[768px] mx-auto border-x border-white/10 shadow-2xl',
    mobile: 'w-[375px] mx-auto border-x border-white/10 shadow-2xl',
  }[breakpoint];

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setDropTargetIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  return (
    <div className="flex-1 bg-[#05070b] overflow-y-auto relative p-4 sm:p-6 select-none">
      <div className={`transition-all duration-300 min-h-screen bg-[#0a0d14] rounded-2xl overflow-hidden ${containerWidths}`}>
        {sections.length === 0 ? (
          <div className="py-32 text-center p-8 border-2 border-dashed border-white/10 rounded-3xl m-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/20">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Your Canvas is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Select and add a section from the Library on the left to start assembling your page.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sections.map((section, index) => {
              const isSelected = selectedSectionId === section.id;
              const definition = getSectionDefinition(section.sectionKey);
              const isDropTarget = dropTargetIndex === index;

              return (
                <div
                  key={section.id}
                  draggable={!isPreview && !section.isLocked}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isPreview) onSelectSection(section.id);
                  }}
                  className={`relative transition-all ${
                    !isPreview
                      ? isSelected
                        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0a0d14] z-20'
                        : 'hover:ring-1 hover:ring-white/20'
                      : ''
                  } ${isDropTarget ? 'border-t-4 border-blue-500' : ''}`}
                >
                  {/* Editor Overlay Controls (Hidden in preview mode) */}
                  {!isPreview && isSelected && (
                    <div className="absolute top-2 right-4 z-30 flex items-center space-x-1 bg-[#101522]/95 backdrop-blur-md border border-white/20 p-1 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      {/* Section Title Pill */}
                      <span className="text-[10px] font-bold text-blue-400 px-2 py-0.5 uppercase tracking-wider font-mono">
                        {section.title || definition?.metadata.name || section.sectionKey}
                      </span>

                      <div className="h-4 w-px bg-white/10 mx-1" />

                      {/* Reorder Up */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index > 0) onReorder(index, index - 1);
                        }}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Reorder Down */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (index < sections.length - 1) onReorder(index, index + 1);
                        }}
                        disabled={index === sections.length - 1}
                        title="Move Down"
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/10"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(section.id);
                        }}
                        title="Duplicate Section"
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(section.id);
                        }}
                        title={section.isVisible ? 'Hide Section' : 'Show Section'}
                        className={`p-1 rounded hover:bg-white/10 ${
                          section.isVisible ? 'text-slate-400 hover:text-white' : 'text-amber-400'
                        }`}
                      >
                        {section.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Lock Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLock(section.id);
                        }}
                        title={section.isLocked ? 'Unlock Section' : 'Lock Section'}
                        className={`p-1 rounded hover:bg-white/10 ${
                          section.isLocked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {section.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(section.id);
                        }}
                        title="Delete Section"
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Representative Section Rendering */}
                  <div className={!section.isVisible && !isPreview ? 'opacity-40 grayscale-[50%]' : ''}>
                    <UniversalSectionRenderer
                      section={section}
                      definition={definition}
                      dataContext={dataContext}
                      isEditing={!isPreview}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
