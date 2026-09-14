'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, X, Check, Loader2, Lock, User } from 'lucide-react';

const PAGES = ['properties', 'leads', 'customers', 'invoices'];
const ACTIONS = [
  { key: 'create', label: 'Create' },
  { key: 'read', label: 'Read' },
  { key: 'update', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'download_pdf', label: 'Download PDF' },
  { key: 'send_email', label: 'Send Email' },
  { key: 'send_whatsapp', label: 'Send WhatsApp' },
];

export default function RolesDashboardPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Role Form
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [dataScope, setDataScope] = useState<'own_data' | 'selected_roles' | 'all_data'>('own_data');
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({
    properties: { read: true, create: true, update: false, delete: false, download_pdf: true, send_email: false, send_whatsapp: false },
    leads: { read: true, create: true, update: true, delete: false, download_pdf: false, send_email: true, send_whatsapp: true },
    customers: { read: true, create: false, update: false, delete: false, download_pdf: true, send_email: true, send_whatsapp: false },
    invoices: { read: true, create: false, update: false, delete: false, download_pdf: true, send_email: false, send_whatsapp: false },
  });
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (page: string, action: string) => {
    setPermissions((prev) => ({
      ...prev,
      [page]: {
        ...prev[page],
        [action]: !prev[page]?.[action],
      },
    }));
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formattedPermissions = Object.entries(permissions).map(([page, actions]) => ({
        page,
        ...actions,
      }));

      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName,
          description,
          dataScope,
          permissions: formattedPermissions,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setRoleName('');
        setDescription('');
        fetchRoles();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Granular RBAC Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
            Dynamic Custom Roles &amp; Page Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure per-page CRUD, PDF downloads, and message dispatch rights with database query scoping.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {/* Roles Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : roles.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white/[0.01] border border-white/5 rounded-2xl">
          No custom roles defined yet. Click &ldquo;Create New Role&rdquo; to set up your team.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div
              key={r._id}
              className="p-5 bg-white/[0.02] border border-white/10 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{r.name}</h3>
                  <p className="text-xs text-slate-400">{r.description || 'Custom staff role'}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  Scope: {r.dataScope.replace('_', ' ')}
                </span>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Allowed Pages:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {r.permissions?.map((p: any) => (
                    <span
                      key={p.page}
                      className="px-2 py-0.5 rounded bg-white/5 text-[11px] text-slate-300 border border-white/10"
                    >
                      {p.page}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#101522] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white">Create Dynamic Role &amp; Scopes</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g. Senior Listing Agent"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Data Scope (Query Filter)</label>
                  <select
                    value={dataScope}
                    onChange={(e) => setDataScope(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="own_data">Own Data Only (createdBy: current user)</option>
                    <option value="selected_roles">Selected Roles Data</option>
                    <option value="all_data">All Data (Unrestricted Company Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Primary duties and responsibilities..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Granular Permission Matrix */}
              <div className="space-y-2 pt-2">
                <label className="block text-slate-300 font-bold">Granular Permission Matrix</label>
                <div className="overflow-x-auto border border-white/10 rounded-xl">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10 text-slate-400">
                        <th className="p-2.5">Resource Page</th>
                        {ACTIONS.map((a) => (
                          <th key={a.key} className="p-2.5 text-center">
                            {a.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {PAGES.map((page) => (
                        <tr key={page} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 font-semibold capitalize text-white">{page}</td>
                          {ACTIONS.map((action) => {
                            const isChecked = !!permissions[page]?.[action.key];
                            return (
                              <td key={action.key} className="p-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(page, action.key)}
                                  className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Role</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
