'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Home, Users, UserCheck, FileText, X } from 'lucide-react';
import { SearchResultItem } from '@/lib/search/globalSearchService';

export const GlobalSearchBar: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search fetch
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');
    router.push(item.targetUrl);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Property':
        return <Home className="w-4 h-4 text-blue-400" />;
      case 'Lead':
        return <Users className="w-4 h-4 text-amber-400" />;
      case 'Customer':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'Invoice':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-between px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 rounded-xl cursor-pointer transition-all shadow-sm"
      >
        <div className="flex items-center space-x-2 text-slate-400 text-xs">
          <Search className="w-3.5 h-3.5 text-blue-400" />
          <span>Search listings, leads, customers, invoices...</span>
        </div>
        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-300 bg-white/10 border border-white/10 rounded shadow-sm">
          ⌘K
        </kbd>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#101522]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50 ring-1 ring-white/10"
          >
            <div className="flex items-center px-3.5 py-2.5 border-b border-white/10 bg-white/[0.02]">
              <Search className="w-4 h-4 text-slate-400 mr-2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to search everything..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none border-none p-0"
              />
              {loading ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : query ? (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQuery('')}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-white/5 p-1">
              {query && results.length === 0 && !loading && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching results found for &ldquo;{query}&rdquo;
                </div>
              )}

              {results.map((item) => (
                <motion.div
                  key={`${item.category}-${item.id}`}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(item)}
                  className="flex items-start space-x-3 p-3 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="mt-0.5 p-1.5 bg-white/[0.04] rounded-lg border border-white/5">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">{item.title}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/5">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
