'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Copy,
  Trash2,
  Edit3,
  Globe,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  Power,
  ExternalLink,
} from 'lucide-react';

interface PageItem {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'disabled' | 'archived';
  isSystemPage?: boolean;
  sections?: any[];
  version: number;
  updatedAt: string;
}

export default function PublicPageManagerPage() {
  const router = useRouter();
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New Page Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newTemplate, setNewTemplate] = useState('blank');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Action feedback
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPages = () => {
    fetch('/api/cms/pages?includeDisabled=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.pages) {
          setPages(data.pages);
        }
      })
      .catch((err) => console.error('Error fetching pages:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3500);
  };

  const handleToggleStatus = async (page: PageItem) => {
    const nextStatus = page.status === 'disabled' ? 'published' : 'disabled';
    try {
      const res = await fetch(`/api/cms/pages/${page._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Page "${page.title}" is now ${nextStatus}.`);
        fetchPages();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDuplicate = async (page: PageItem) => {
    try {
      const res = await fetch(`/api/cms/pages/${page._id}/duplicate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Page duplicated as "${data.page.title}".`);
        fetchPages();
      }
    } catch (err) {
      console.error('Error duplicating page:', err);
    }
  };

  const handleDeleteOrArchive = async (page: PageItem) => {
    const isSystem = page.isSystemPage;
    const confirmMsg = isSystem
      ? `System page "${page.title}" cannot be deleted permanently. Disable public accessibility instead?`
      : `Archive custom page "${page.title}"?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/cms/pages/${page._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(isSystem ? `System page "${page.title}" disabled.` : `Page "${page.title}" archived.`);
        fetchPages();
      }
    } catch (err) {
      console.error('Error deleting page:', err);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const res = await fetch('/api/cms/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || newTitle.toLowerCase().replace(/[\s_]+/g, '-'),
          template: newTemplate,
          status: 'draft',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        setNewTitle('');
        setNewSlug('');
        fetchPages();
        router.push(`/dashboard/website/cms/pages/${data.page._id}/builder`);
      } else {
        setCreateError(data.error || 'Failed to create page.');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Network error.');
    } finally {
      setCreating(false);
    }
  };

  const filteredPages = pages.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-[#070a0f] text-white p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Public Page Manager</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage default system pages, custom landings, and live routes</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Page</span>
          </button>
        </div>
      </div>

      {/* Action Toast Feedback */}
      {actionMessage && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121f] border border-white/10 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pages by title or slug (/properties, /about)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          {['all', 'published', 'draft', 'disabled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                statusFilter === st ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Pages Table / Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
          <p className="text-xs">Loading public pages...</p>
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-3xl p-8 space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Pages Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery ? 'No pages matched your search filter.' : 'Create your first custom page to begin building.'}
          </p>
        </div>
      ) : (
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0d121f]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Page Title & Type</th>
                  <th className="py-3 px-4">Route Slug</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sections</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPages.map((page) => {
                  const isHome = page.slug === '' || page.slug === 'home';
                  const publicUrl = isHome ? '/' : `/c/${page.slug}`;

                  return (
                    <tr key={page._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-4 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="block">{page.title}</span>
                            {page.isSystemPage && (
                              <span className="text-[10px] text-blue-400 font-mono">System Page</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        <span>/{page.slug}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            page.status === 'published'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : page.status === 'draft'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-400">
                        {page.sections?.length || 0} sections
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-400">
                        v{page.version || 1}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          {/* Toggle Enabled / Disabled */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(page)}
                            title={page.status === 'disabled' ? 'Enable Public Access' : 'Disable Public Page'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              page.status === 'disabled'
                                ? 'bg-rose-500/20 border-rose-500/30 text-rose-400 hover:bg-rose-500/30'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Open Visual Builder */}
                          <Link
                            href={`/dashboard/website/cms/pages/${page._id}/builder`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition-all font-semibold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Builder</span>
                          </Link>

                          {/* Preview Public Page */}
                          <Link
                            href={publicUrl}
                            target="_blank"
                            title="Preview Public Page"
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => handleDuplicate(page)}
                            title="Duplicate Page"
                            className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Archive */}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrArchive(page)}
                            title={page.isSystemPage ? 'Disable System Page' : 'Archive Custom Page'}
                            className="p-1.5 bg-white/5 hover:bg-rose-500/20 rounded-lg text-slate-400 hover:text-rose-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Custom Page Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d121f] border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create New Custom Page</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[\s_]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Waterfront Penthouse Collection"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">URL Route Slug</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-slate-400 font-mono">
                    /c/
                  </span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="waterfront-penthouse"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-r-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Unique path within your website. Protected against reserved routes.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Template</label>
                <select
                  value={newTemplate}
                  onChange={(e) => setNewTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="blank">Blank Canvas (Start Empty)</option>
                  <option value="luxury_home">Luxury Home Landing (Hero + Grid + CTA)</option>
                  <option value="property_detail">Property Showcase (Detail + 3D Walkthrough)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Page & Open Builder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
