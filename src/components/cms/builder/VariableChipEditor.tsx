'use client';

import React, { useState, useEffect, useRef } from 'react';
import { TokenNode, parseStringToTokens, serializeTokensToString } from '@/lib/cms/tokenEngine';
import { Sparkles, X, Plus, Settings2 } from 'lucide-react';

interface VariableChipEditorProps {
  value: string | TokenNode[];
  onChange: (value: string, tokens: TokenNode[]) => void;
  availableVariables?: Array<{ key: string; label: string; type: string }>;
  placeholder?: string;
  multiline?: boolean;
}

export const VariableChipEditor: React.FC<VariableChipEditorProps> = ({
  value,
  onChange,
  availableVariables = [
    { key: 'property.title', label: 'Property Title', type: 'string' },
    { key: 'property.price', label: 'Property Price', type: 'number' },
    { key: 'property.location.city', label: 'Property City', type: 'string' },
    { key: 'property.specs.bedrooms', label: 'Bedrooms', type: 'number' },
    { key: 'brand.name', label: 'Company Brand Name', type: 'string' },
    { key: 'customer.fullName', label: 'Client Name', type: 'string' },
  ],
  placeholder = 'Type text or insert dynamic variable chips...',
  multiline = false,
}) => {
  const [tokens, setTokens] = useState<TokenNode[]>(() => {
    if (Array.isArray(value)) return value;
    return parseStringToTokens(value || '');
  });

  const [activeChipIndex, setActiveChipIndex] = useState<number | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    if (Array.isArray(value)) {
      setTokens(value);
    } else if (typeof value === 'string') {
      const parsed = parseStringToTokens(value);
      setTokens(parsed);
    }
  }, [value]);

  const updateTokens = (newTokens: TokenNode[]) => {
    setTokens(newTokens);
    const serialized = serializeTokensToString(newTokens);
    onChange(serialized, newTokens);
  };

  const handleTextChange = (index: number, newText: string) => {
    const updated = [...tokens];
    updated[index] = { type: 'text', value: newText };
    updateTokens(updated);
  };

  const insertVariable = (key: string) => {
    const newTokens = [
      ...tokens,
      { type: 'variable' as const, key },
      { type: 'text' as const, value: ' ' },
    ];
    updateTokens(newTokens);
    setIsPickerOpen(false);
  };

  const removeChip = (index: number) => {
    const updated = tokens.filter((_, i) => i !== index);
    updateTokens(updated.length > 0 ? updated : [{ type: 'text', value: '' }]);
    setActiveChipIndex(null);
  };

  const updateChipSettings = (index: number, formatter?: any, fallback?: string) => {
    const updated = [...tokens];
    const target = updated[index];
    if (target.type === 'variable') {
      updated[index] = {
        ...target,
        formatter: formatter || undefined,
        fallback: fallback || undefined,
      };
      updateTokens(updated);
    }
    setActiveChipIndex(null);
  };

  return (
    <div className="w-full space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">Content with Dynamic Variables</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-semibold"
          >
            <Plus className="w-3 h-3" />
            <span>Insert Variable</span>
          </button>

          {isPickerOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-[#101522] border border-white/15 rounded-xl shadow-2xl z-50 p-2 space-y-1">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-bold px-2 py-1">
                Available Tokens
              </span>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {availableVariables.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] text-slate-300 hover:bg-white/5 hover:text-blue-400 flex items-center justify-between"
                  >
                    <span>{v.label}</span>
                    <span className="text-[9px] font-mono text-slate-500">{v.type}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Surface with Chips */}
      <div className="min-h-[72px] p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-wrap items-center gap-1.5 focus-within:border-blue-500 transition-colors">
        {tokens.map((token, i) => {
          if (token.type === 'variable') {
            const isSelected = activeChipIndex === i;
            return (
              <span
                key={i}
                className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30'
                }`}
              >
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span className="font-mono">{token.key}</span>
                {token.formatter && (
                  <span className="text-[9px] bg-black/30 px-1 rounded uppercase tracking-wider">
                    {token.formatter}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setActiveChipIndex(isSelected ? null : i)}
                  className="hover:text-white p-0.5"
                  title="Configure Token Formatter & Fallback"
                >
                  <Settings2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeChip(i)}
                  className="hover:text-rose-400 p-0.5"
                  title="Delete Variable Chip"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          }

          return (
            <input
              key={i}
              type="text"
              value={token.value}
              onChange={(e) => handleTextChange(i, e.target.value)}
              placeholder={tokens.length === 1 && !token.value ? placeholder : ''}
              className="bg-transparent text-white focus:outline-none text-xs flex-1 min-w-[60px]"
            />
          );
        })}
      </div>

      {/* Chip Formatter & Fallback Modal */}
      {activeChipIndex !== null && tokens[activeChipIndex]?.type === 'variable' && (
        <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white flex items-center space-x-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Token Settings: {(tokens[activeChipIndex] as any).key}</span>
            </span>
            <button
              type="button"
              onClick={() => setActiveChipIndex(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Safe Formatter</label>
              <select
                value={(tokens[activeChipIndex] as any).formatter || ''}
                onChange={(e) =>
                  updateChipSettings(
                    activeChipIndex,
                    e.target.value,
                    (tokens[activeChipIndex] as any).fallback
                  )
                }
                className="w-full px-2 py-1.5 bg-[#101522] border border-white/10 rounded-lg text-white text-xs"
              >
                <option value="">None (Raw Value)</option>
                <option value="currency">Currency ($1,250,000)</option>
                <option value="number">Formatted Number (1,250)</option>
                <option value="date">Date (Sep 18, 2026)</option>
                <option value="uppercase">Uppercase (CAPS)</option>
                <option value="relative_time">Relative Time (2d ago)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-1">Fallback Value</label>
              <input
                type="text"
                placeholder="e.g. Contact for Price"
                value={(tokens[activeChipIndex] as any).fallback || ''}
                onChange={(e) =>
                  updateChipSettings(
                    activeChipIndex,
                    (tokens[activeChipIndex] as any).formatter,
                    e.target.value
                  )
                }
                className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
