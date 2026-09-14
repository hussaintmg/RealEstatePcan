'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicCmsIcon } from '@/lib/cms/iconResolver';
import {
  Search,
  X,
  Home,
  Building2,
  Compass,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  ShieldCheck,
  Sparkles,
  Phone,
  Mail,
  User,
  Users,
  Star,
  Layers,
  FileText,
  DollarSign,
  Heart,
  Eye,
  Camera,
  Play,
  Share2,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  Sliders,
  Check,
} from 'lucide-react';

const COMMON_ICONS = [
  'Building2',
  'Home',
  'Compass',
  'MapPin',
  'Sparkles',
  'ShieldCheck',
  'Bed',
  'Bath',
  'Maximize2',
  'Phone',
  'Mail',
  'User',
  'Users',
  'Star',
  'Layers',
  'FileText',
  'DollarSign',
  'Heart',
  'Eye',
  'Camera',
  'Play',
  'Share2',
  'ChevronRight',
  'ArrowRight',
  'ExternalLink',
  'Sliders',
];

interface IconPickerProps {
  value?: string;
  onChange: (iconName: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  value = 'Building2',
  onChange,
  label = 'Select Icon',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customInput, setCustomInput] = useState('');

  const filteredIcons = COMMON_ICONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-1.5">
      {label && <label className="block text-[11px] font-semibold text-slate-400 uppercase">{label}</label>}

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl text-xs text-white transition-all shadow-sm"
        >
          <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg">
            <DynamicCmsIcon name={value} className="w-4 h-4" fallbackIcon={<Building2 className="w-4 h-4" />} />
          </div>
          <span className="font-medium text-slate-200">{value || 'Choose Icon'}</span>
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Clear icon"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="p-4 bg-[#101522] border border-white/15 rounded-2xl shadow-2xl space-y-3 z-50 w-full max-w-sm"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Icon Library</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search icons (e.g. Home, MapPin)..."
                className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {filteredIcons.map((iconName) => {
                const isSelected = value === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onChange(iconName);
                      setIsOpen(false);
                    }}
                    title={iconName}
                    className={`p-2.5 flex items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'bg-white/[0.03] text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <DynamicCmsIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Custom Icon / URL Input */}
            <div className="pt-2 border-t border-white/10 flex items-center space-x-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Or custom Lucide name / image URL..."
                className="flex-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (customInput.trim()) {
                    onChange(customInput.trim());
                    setIsOpen(false);
                    setCustomInput('');
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
