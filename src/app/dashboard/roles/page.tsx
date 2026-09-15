'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Copy,
  Trash2,
  Edit2,
  Users,
  AlertTriangle,
  Archive,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { SearchInput } from '@/components/ui/SearchInput';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AsyncState } from '@/components/ui/AsyncState';
import {
  MODULE_ORDER,
  getPermissionsByModule,
  ROLE_PRESETS,
  DataScope,
  RolePermissionAssignment,
} from '@/lib/permissions/registry';

interface RoleRecord {
  _id: string;
  name: string;
  description?: string;
  dataScope: string;
  capabilities: { key: string; enabled: boolean; scope?: DataScope }[];
  permissions?: any[];
  userCount?: number;
  status: 'active' | 'archived';
  isSystem?: boolean;
  version?: number;
  createdAt: string;
}

export default function RolesDashboardPage() {
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');

  // Modal / Form state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [dataScope, setDataScope] = useState<'own_data' | 'selected_roles' | 'all_data'>('own_data');
  const [capabilityState, setCapabilityState] = useState<Record<string, { enabled: boolean; scope?: DataScope }>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Deletion / Archive confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    role: RoleRecord | null;
    action: 'delete' | 'archive';
  }>({
    isOpen: false,
    role: null,
    action: 'delete',
  });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roles?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles || []);
      } else {
        setError(data.message || 'Failed to load roles');
      }
    } catch {
      setError('Network communication error while loading roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [statusFilter]);

  // Open editor for creating new role
  const handleOpenCreate = () => {
    setEditingRoleId(null);
    setRoleName('');
    setDescription('');
    setDataScope('own_data');
    setCapabilityState({});
    setFormError(null);
    setIsEditorOpen(true);
  };

  // Open editor for modifying existing role
  const handleOpenEdit = (role: RoleRecord) => {
    setEditingRoleId(role._id);
    setRoleName(role.name);
    setDescription(role.description || '');
    setDataScope((role.dataScope as any) || 'own_data');

    const mapped: Record<string, { enabled: boolean; scope?: DataScope }> = {};
    if (Array.isArray(role.capabilities)) {
      for (const c of role.capabilities) {
        mapped[c.key] = { enabled: c.enabled, scope: c.scope };
      }
    }
    setCapabilityState(mapped);
    setFormError(null);
    setIsEditorOpen(true);
  };

  // Clone an existing role
  const handleCloneRole = async (role: RoleRecord) => {
    try {
      const res = await fetch(`/api/roles/${role._id}/clone`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchRoles();
      } else {
        alert(data.message || 'Failed to clone role');
      }
    } catch {
      alert('Error communicating with server while cloning role');
    }
  };

  // Load a starter preset
  const handleApplyPreset = (presetId: string) => {
    const preset = ROLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setRoleName(editingRoleId ? roleName : preset.name);
    if (!editingRoleId) setDescription(preset.description);

    const newCapState: Record<string, { enabled: boolean; scope?: DataScope }> = {};
    for (const a of preset.assignments) {
      newCapState[a.key] = { enabled: a.enabled, scope: a.scope };
    }
    setCapabilityState(newCapState);
  };

  // Toggle single capability
  const handleToggleCapability = (key: string, supportedScopes?: DataScope[], defaultScope?: DataScope) => {
    setCapabilityState((prev) => {
      const current = prev[key]?.enabled || false;
      const next = !current;
      const nextScope = next
        ? prev[key]?.scope || defaultScope || (supportedScopes ? supportedScopes[0] : undefined)
        : prev[key]?.scope;

      const updated = {
        ...prev,
        [key]: { enabled: next, scope: nextScope },
      };

      return updated;
    });
  };

  // Change data scope on capability
  const handleScopeChange = (key: string, scope: DataScope) => {
    setCapabilityState((prev) => ({
      ...prev,
      [key]: {
        enabled: prev[key]?.enabled ?? true,
        scope,
      },
    }));
  };

  // Save role (Create or Update)
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      setFormError('Role name is required.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const capabilitiesArray: RolePermissionAssignment[] = Object.entries(capabilityState).map(
      ([key, val]) => ({
        key,
        enabled: !!val.enabled,
        scope: val.scope,
      })
    );

    try {
      const url = editingRoleId ? `/api/roles/${editingRoleId}` : '/api/roles';
      const method = editingRoleId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          description: description.trim(),
          dataScope,
          capabilities: capabilitiesArray,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditorOpen(false);
        fetchRoles();
      } else {
        setFormError(data.message || 'Failed to save role configuration.');
      }
    } catch {
      setFormError('Network error while saving role.');
    } finally {
      setSaving(false);
    }
  };

  // Delete or Archive confirmation trigger
  const handleExecuteDeleteOrArchive = async () => {
    if (!confirmDialog.role) return;
    setActionLoading(true);

    try {
      const role = confirmDialog.role;
      const isArchive = confirmDialog.action === 'archive';
      const url = `/api/roles/${role._id}${isArchive ? '?archive=true' : ''}`;

      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok && data.success) {
        setConfirmDialog({ isOpen: false, role: null, action: 'delete' });
        fetchRoles();
      } else {
        alert(data.message || 'Action failed.');
      }
    } catch {
      alert('Network error while processing role action.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      const matchesSearch =
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && r.status !== 'archived') ||
        (statusFilter === 'archived' && r.status === 'archived');

      return matchesSearch && matchesStatus;
    });
  }, [roles, search, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-4">
      <PageHeader
        title="RBAC Roles & Capability Scoping"
        description="Configure granular business capabilities, data scopes (own, assigned, all), and security assignments."
        icon={ShieldCheck}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Roles & Scoping' },
        ]}
        actions={
          <Button
            onClick={handleOpenCreate}
            icon={Plus}
            className="shadow-lg shadow-emerald-500/20"
          >
            Create Custom Role
          </Button>
        }
      />

      {/* Control Bar: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search roles by title..."
            size="md"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400 font-medium mr-1">Status:</span>
          {(['active', 'archived', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Roles Grid */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : filteredRoles.length === 0 ? 'empty' : 'success'}
        errorMessage={error || undefined}
        onRetry={fetchRoles}
        emptyTitle="No roles found"
        emptyDescription={search ? 'No roles match your search query.' : 'Create your first custom role to get started.'}
        emptyAction={
          <Button onClick={handleOpenCreate} icon={Plus} size="sm">
            Create Role
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => {
            const enabledCapsCount = (role.capabilities || []).filter((c) => c.enabled).length;

            return (
              <div
                key={role._id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-950/20 backdrop-blur-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                      {role.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      {role.status === 'archived' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Archived
                        </span>
                      )}
                      {role.isSystem && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          System
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-6 min-h-[32px]">
                    {role.description || 'No description provided.'}
                  </p>

                  <div className="space-y-2.5 py-3 border-y border-white/5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Assigned Staff</span>
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        {role.userCount || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Active Capabilities</span>
                      <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {enabledCapsCount} enabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Default Data Scope</span>
                      <span className="font-medium text-slate-300 uppercase text-[11px] tracking-wider">
                        {role.dataScope ? role.dataScope.replace('_', ' ') : 'own'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(role)}
                      icon={Edit2}
                      className="text-xs"
                    >
                      Configure
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloneRole(role)}
                      icon={Copy}
                      title="Duplicate Role"
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clone
                    </Button>
                  </div>

                  {!role.isSystem && (
                    <div className="flex items-center gap-1">
                      {role.status !== 'archived' ? (
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              role,
                              action: (role.userCount || 0) > 0 ? 'archive' : 'delete',
                            })
                          }
                          title={(role.userCount || 0) > 0 ? 'Archive role (users assigned)' : 'Delete role'}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              role,
                              action: 'delete',
                            })
                          }
                          title="Permanently remove"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </AsyncState>

      {/* Role Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingRoleId ? `Configure Role: ${roleName}` : 'Create Security Role'}
        description="Select enabled capabilities and configure data scopes per module."
        size="xl"
      >
        <form onSubmit={handleSaveRole} className="space-y-6">
          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Quick Presets Bar */}
          {!editingRoleId && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Quick Starter Presets</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {ROLE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 hover:border-emerald-500/40 transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Role Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Senior Sales Agent"
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Default Data Scope
              </label>
              <select
                value={dataScope}
                onChange={(e) => setDataScope(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-colors"
              >
                <option value="own_data">Own Records Only</option>
                <option value="selected_roles">Team / Department</option>
                <option value="all_data">All Workspace Records</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the functional responsibilities of staff assigned to this role..."
                className="w-full px-4 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Module Capabilities Matrix */}
          <div className="space-y-6 pt-4 border-t border-white/10">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Granular Business Capabilities &amp; Scopes
            </h4>

            <div className="space-y-6 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
              {MODULE_ORDER.map((mod) => {
                const perms = getPermissionsByModule(mod.key);
                if (perms.length === 0) return null;

                return (
                  <div
                    key={mod.key}
                    className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div>
                        <h5 className="text-sm font-semibold text-white tracking-tight">{mod.label}</h5>
                        <p className="text-[11px] text-slate-400">{mod.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      {perms.map((perm) => {
                        const isAssigned = !!capabilityState[perm.key]?.enabled;
                        const currentScope =
                          capabilityState[perm.key]?.scope || perm.defaultScope || 'all';

                        return (
                          <div
                            key={perm.key}
                            className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isAssigned
                                ? 'bg-emerald-950/10 border-emerald-500/30'
                                : 'bg-slate-900/40 border-white/5'
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-slate-200">
                                  {perm.label}
                                </span>
                                {perm.dangerous && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                                    <AlertTriangle className="w-3 h-3" />
                                    Sensitive
                                  </span>
                                )}
                                {perm.requiresFeature && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                    req: {perm.requiresFeature}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{perm.description}</p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                              {/* Scope Selector if capability supports scoping */}
                              {perm.supportedScopes && perm.supportedScopes.length > 0 && isAssigned && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                    Scope:
                                  </span>
                                  <select
                                    value={currentScope}
                                    onChange={(e) => handleScopeChange(perm.key, e.target.value as DataScope)}
                                    className="px-2 py-1 bg-slate-800 border border-white/10 rounded-md text-xs text-emerald-300 focus:outline-none focus:border-emerald-500/50"
                                  >
                                    {perm.supportedScopes.map((sc) => (
                                      <option key={sc} value={sc}>
                                        {sc.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Reusable Capsule Switch */}
                              <Switch
                                checked={isAssigned}
                                onChange={() =>
                                  handleToggleCapability(perm.key, perm.supportedScopes, perm.defaultScope)
                                }
                                size="sm"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditorOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingRoleId ? 'Save Changes' : 'Create Role'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Archive / Delete */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, role: null, action: 'delete' })}
        onConfirm={handleExecuteDeleteOrArchive}
        title={confirmDialog.action === 'archive' ? 'Archive Role?' : 'Permanently Delete Role?'}
        description={
          confirmDialog.action === 'archive'
            ? `Role '${confirmDialog.role?.name}' has ${confirmDialog.role?.userCount} assigned staff member(s). Archiving will preserve audit linkages while preventing new assignments.`
            : `Are you sure you want to delete '${confirmDialog.role?.name}'? This action cannot be undone.`
        }
        confirmText={confirmDialog.action === 'archive' ? 'Archive Role' : 'Delete Role'}
        variant={confirmDialog.action === 'archive' ? 'warning' : 'danger'}
        loading={actionLoading}
      />
    </div>
  );
}
