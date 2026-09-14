'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataGridSelection } from '@/context/DataGridSelectionContext';
import { BulkProgressModal } from './BulkProgressModal';
import { runConcurrentBatch, BulkProgress } from '@/lib/bulkWorker';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Trash2,
  Download,
  Mail,
  MessageSquare,
  ArrowUpDown,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

interface DataGridProps<T extends { _id: string }> {
  title: string;
  data: T[];
  columns: ColumnDef<T>[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearchChange?: (term: string) => void;
  onFilterChange?: (filterKey: string, value: string) => void;
  onSortChange?: (sortKey: string, direction: 'asc' | 'desc') => void;
  filters?: FilterOption[];
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkExportPdf?: (ids: string[]) => Promise<void>;
  onBulkSendEmail?: (ids: string[]) => Promise<void>;
  onBulkSendWhatsApp?: (ids: string[]) => Promise<void>;
  actions?: (item: T) => React.ReactNode;
}

export function DataGrid<T extends { _id: string }>({
  title,
  data,
  columns,
  totalItems,
  totalPages,
  currentPage,
  onPageChange,
  onSearchChange,
  onFilterChange,
  onSortChange,
  filters = [],
  onBulkDelete,
  onBulkExportPdf,
  onBulkSendEmail,
  onBulkSendWhatsApp,
  actions,
}: DataGridProps<T>) {
  const {
    selectedIds,
    toggleSelect,
    selectPage,
    deselectPage,
    clearSelection,
    isSelected,
    isAllPageSelected,
    selectedCount,
  } = useDataGridSelection();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Bulk progress modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [bulkProgress, setBulkProgress] = useState<BulkProgress | null>(null);
  const [isBulkComplete, setIsBulkComplete] = useState(false);

  const currentPageIds = data.map((d) => d._id);
  const isAllSelected = isAllPageSelected(currentPageIds);
  const isSomeSelected = currentPageIds.some((id) => selectedIds.has(id)) && !isAllSelected;

  const handleHeaderCheckbox = () => {
    if (isAllSelected) {
      deselectPage(currentPageIds);
    } else {
      selectPage(currentPageIds);
    }
  };

  const handleSort = (key: string) => {
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortDir(nextDir);
    if (onSortChange) onSortChange(key, nextDir);
  };

  const executeBulkAction = async (
    actionName: string,
    workerFn: (id: string) => Promise<any>,
    onCompleteCallback?: () => void
  ) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setModalTitle(`Executing ${actionName} (${ids.length} items)`);
    setIsBulkComplete(false);
    setIsModalOpen(true);

    await runConcurrentBatch(
      ids,
      5,
      async (id) => {
        await workerFn(id);
      },
      (progress) => {
        setBulkProgress(progress);
      }
    );

    setIsBulkComplete(true);
    if (onCompleteCallback) onCompleteCallback();
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing 20 items per page • Total {totalItems} records
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {onSearchChange && (
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                placeholder="Search..."
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onSearchChange(e.target.value);
                }}
                className="w-full pl-9 pr-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:border-blue-500/50"
              />
            </div>
          )}

          {filters.map((f) => (
            <select
              key={f.key}
              onChange={(e) => onFilterChange && onFilterChange(f.key, e.target.value)}
              className="bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-300 py-1.5 px-3 focus:border-blue-500/50 cursor-pointer"
            >
              <option value="">All {f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      </div>

      {/* Cross-Page Bulk Selection Toolbar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gradient-to-r from-blue-900/40 via-blue-800/20 to-indigo-900/40 border border-blue-500/30 rounded-2xl shadow-xl shadow-blue-950/40 backdrop-blur-md"
          >
            <div className="flex items-center space-x-3 text-xs">
              <span className="font-semibold text-blue-300">
                {selectedCount} item{selectedCount > 1 ? 's' : ''} selected across pages
              </span>
              <button
                onClick={clearSelection}
                className="text-slate-400 hover:text-white underline text-xs transition-colors"
              >
                Deselect all
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {onBulkExportPdf && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    executeBulkAction('PDF Export', async (id) => {
                      await onBulkExportPdf([id]);
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-white/10"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bulk PDF</span>
                </motion.button>
              )}

              {onBulkSendEmail && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    executeBulkAction('Send Email', async (id) => {
                      await onBulkSendEmail([id]);
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-white/10"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Bulk Email</span>
                </motion.button>
              )}

              {onBulkSendWhatsApp && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    executeBulkAction('Send WhatsApp', async (id) => {
                      await onBulkSendWhatsApp([id]);
                    })
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-white/10"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bulk WhatsApp</span>
                </motion.button>
              )}

              {onBulkDelete && (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() =>
                    executeBulkAction('Bulk Delete', async (id) => {
                      await onBulkDelete([id]);
                    }, clearSelection)
                  }
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium transition-colors border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bulk Delete</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03] text-slate-300 font-medium">
              <th className="p-3.5 w-10 text-center">
                <button
                  type="button"
                  onClick={handleHeaderCheckbox}
                  className="text-slate-400 hover:text-white"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-400" />
                  ) : isSomeSelected ? (
                    <MinusSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>

              {columns.map((col) => (
                <th key={col.key} className="p-3.5 whitespace-nowrap">
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="flex items-center space-x-1 hover:text-white transition-colors"
                    >
                      <span>{col.header}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}

              {actions && <th className="p-3.5 text-right">Actions</th>}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-slate-300">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="p-8 text-center text-slate-500">
                  No records found matching current parameters.
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const checked = isSelected(item._id);
                return (
                  <tr
                    key={item._id}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      checked ? 'bg-blue-500/[0.04]' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item._id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>

                    {columns.map((col) => (
                      <td key={col.key} className="p-3.5 whitespace-nowrap">
                        {col.render ? col.render(item) : (item as any)[col.key] ?? '-'}
                      </td>
                    ))}

                    {actions && <td className="p-3.5 text-right">{actions(item)}</td>}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
        <div>
          Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
          <span className="font-semibold text-white">{totalPages}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-200 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-slate-200 rounded-lg transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Modal */}
      <BulkProgressModal
        isOpen={isModalOpen}
        title={modalTitle}
        progress={bulkProgress}
        isComplete={isBulkComplete}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
