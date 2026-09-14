'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getModelVariables, ModelVariableDef } from '@/lib/cms/variableRegistry';
import {
  GripHorizontal,
  Search,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface DraggableVariableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertVariable?: (token: string) => void;
}

export const DraggableVariableModal: React.FC<DraggableVariableModalProps> = ({
  isOpen,
  onClose,
  onInsertVariable,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const variables = getModelVariables();

  const filtered = variables.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesSearch =
      v.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (v: ModelVariableDef) => {
    const token = v.type === 'array' && v.loopSyntax ? v.loopSyntax : `{{${v.key}}}`;
    navigator.clipboard.writeText(token);
    setCopiedKey(v.key);
    if (onInsertVariable) onInsertVariable(token);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'array':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
            ARRAY [ ]
          </span>
        );
      case 'number':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            NUM #
          </span>
        );
      case '3d_model':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
            3D GLB
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
            TEXT
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.08}
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="fixed z-50 left-12 top-24 w-96 bg-[#101522]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[540px] select-none shadow-blue-900/20 ring-1 ring-white/10"
        >
          {/* Draggable Header Handle */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white/[0.04] border-b border-white/10 cursor-grab active:cursor-grabbing hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center space-x-2">
              <GripHorizontal className="w-4 h-4 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-white tracking-wide">
                Model Sync Dynamic Variables
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Search & Category Tabs */}
          <div className="p-3 space-y-2 border-b border-white/10 bg-black/20">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search variables (e.g. price, amenities)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:border-blue-500/50 outline-none transition-colors"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto text-[11px] pb-1">
              {['All', 'Property', 'Customer', 'Invoice', 'Agency'].map((cat) => (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Variable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No variables found</div>
            ) : (
              filtered.map((v) => {
                const isCopied = copiedKey === v.key;
                return (
                  <motion.div
                    key={v.key}
                    whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCopy(v)}
                    className="group p-2 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-white">{v.label}</span>
                        {getTypeBadge(v.type)}
                      </div>
                      <span className="text-slate-400 group-hover:text-blue-400 p-1">
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <code className="font-mono text-blue-300/90 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        {`{{${v.key}}}`}
                      </code>
                      <span className="text-slate-400 truncate max-w-[140px]">{v.example}</span>
                    </div>

                    {v.loopSyntax && (
                      <p className="mt-1 text-[10px] text-purple-300/80 font-mono bg-purple-500/10 p-1 rounded">
                        Loop: {v.loopSyntax}
                      </p>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-black/40 border-t border-white/10 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Click any row to insert into template</span>
            <span className="text-blue-400 font-medium">Free drag anywhere</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
