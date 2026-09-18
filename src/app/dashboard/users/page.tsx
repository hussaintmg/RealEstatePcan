'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  Key,
  Mail,
  Phone,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  UserX,
  UserCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { SearchInput } from '@/components/ui/SearchInput';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';

interface StaffUser {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  companyName?: string;
  isDeveloper: boolean;
  isOwner: boolean;
  roleId?: string | null;
  role?: {
    _id: string;
    name: string;
    description?: string;
    status: string;
    version: number;
  } | null;
  isActive: boolean;
  createdAt: string;
}

interface RoleOption {
  _id: string;
  name: string;
  description?: string;
  status: string;
}

export default function UsersManagementPage() {
  const { user, can } = useAuth();

  const [users, setUsers] = useState<StaffUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal State: Create User
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal State: Edit User
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    roleId: '',
    isActive: true,
    newPassword: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Confirmation Dialog: Deactivate User
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    targetUser: StaffUser | null;
    action: 'deactivate' | 'activate' | 'delete';
  }>({
    isOpen: false,
    targetUser: null,
    action: 'deactivate',
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Authorization check
  const isAuthorized = user?.isDeveloper || user?.isOwner || can('users.manage');

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/roles?status=active');
      const data = await res.json();
      if (data.success && Array.isArray(data.roles)) {
        setRoles(data.roles);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '18');
      if (search.trim()) params.set('search', search.trim());
      if (selectedRoleFilter) params.set('roleId', selectedRoleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
        setTotalUsers(data.total || 0);
      } else {
        setError(data.message || 'Failed to retrieve team members.');
      }
    } catch {
      setError('Network communication error connecting to User service.');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedRoleFilter, statusFilter, isAuthorized]);

  useEffect(() => {
    if (isAuthorized) {
      fetchRoles();
      fetchUsers();
    }
  }, [isAuthorized, fetchRoles, fetchUsers]);

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = 'Staff@';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, password: pass }));
  };

  const handleOpenCreate = () => {
    setCreateForm({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      roleId: roles.length > 0 ? roles[0]._id : '',
    });
    setCreateError(null);
    generateRandomPassword();
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsCreateOpen(false);
        fetchUsers();
      } else {
        setCreateError(data.message || 'Failed to create team member.');
      }
    } catch {
      setCreateError('Error communicating with server.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleOpenEdit = (targetUser: StaffUser) => {
    setEditingUser(targetUser);
    setEditForm({
      fullName: targetUser.fullName,
      phone: targetUser.phone || '',
      roleId: targetUser.roleId || '',
      isActive: targetUser.isActive,
      newPassword: '',
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditSubmitting(true);
    setEditError(null);

    try {
      const payload: any = {
        fullName: editForm.fullName,
        phone: editForm.phone,
        roleId: editForm.roleId || null,
        isActive: editForm.isActive,
      };
      if (editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setIsEditOpen(false);
        fetchUsers();
      } else {
        setEditError(data.message || 'Failed to update user.');
      }
    } catch {
      setEditError('Error communicating with server.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleToggleActiveQuick = async (targetUser: StaffUser) => {
    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !targetUser.isActive }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch {
      // ignore
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.targetUser) return;
    setActionLoading(true);

    try {
      const { targetUser, action } = confirmDialog;
      if (action === 'delete') {
        const res = await fetch(`/api/users/${targetUser.id}?permanent=true`, { method: 'DELETE' });
        if (res.ok) {
          setConfirmDialog({ isOpen: false, targetUser: null, action: 'delete' });
          fetchUsers();
        }
      } else {
        const nextActive = action === 'activate';
        const res = await fetch(`/api/users/${targetUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: nextActive }),
        });
        if (res.ok) {
          setConfirmDialog({ isOpen: false, targetUser: null, action: 'deactivate' });
          fetchUsers();
        }
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <AccessDeniedState
          title="Access Restricted"
          message="You do not have permission to access Staff & User Management ('users.manage' capability required)."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Page Header */}
      <PageHeader
        title="Users & Access Management"
        description="Provision team members, assign granular security roles, configure active staff accounts, and maintain security auditability."
        actions={
          <Button
            onClick={handleOpenCreate}
            icon={UserPlus}
            className="shadow-lg shadow-emerald-500/20"
          >
            Add Team Member
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/5 backdrop-blur-xl">
        <div className="w-full md:w-80">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search by name, email, or phone..."
            size="sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Role Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Chips */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-white/5 text-xs">
            {(['active', 'inactive', 'all'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-500/20 text-emerald-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchUsers}
            icon={RefreshCw}
            className="text-xs text-slate-400 hover:text-white"
            title="Refresh list"
          />
        </div>
      </div>

      {/* Users Grid */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : users.length === 0 ? 'empty' : 'success'}
        errorMessage={error || undefined}
        emptyTitle="No Team Members Found"
        emptyDescription={
          search || selectedRoleFilter || statusFilter !== 'all'
            ? 'No team members match your filter criteria.'
            : 'No staff users have been provisioned yet.'
        }
        emptyAction={
          <Button onClick={handleOpenCreate} icon={UserPlus} size="sm">
            Add First Team Member
          </Button>
        }
        onRetry={fetchUsers}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((item) => {
            const isSelf = user?.id === item.id;
            const isProtected = item.isDeveloper || item.isOwner;

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  !item.isActive
                    ? 'bg-slate-900/30 border-white/5 opacity-70'
                    : item.isDeveloper
                    ? 'bg-indigo-950/20 border-indigo-500/30'
                    : item.isOwner
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-slate-900/60 border-white/10 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Top Bar: Role badge & Status Switch */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.isDeveloper ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Developer
                        </span>
                      ) : item.isOwner ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Primary Owner
                        </span>
                      ) : item.role ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.role.name}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-white/5">
                          Unassigned Role
                        </span>
                      )}

                      {isSelf && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-white border border-white/20">
                          You
                        </span>
                      )}
                    </div>

                    {!isProtected && (
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={item.isActive}
                          onChange={() => handleToggleActiveQuick(item)}
                          size="sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* User Profile Header */}
                  <div className="space-y-1 mb-4">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {item.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate">{item.email}</span>
                    </div>
                    {item.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span>{item.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500">
                    Joined {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(item)}
                      icon={Edit2}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      Edit Access
                    </Button>

                    {!isProtected && !isSelf && (
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            targetUser: item,
                            action: item.isActive ? 'deactivate' : 'activate',
                          })
                        }
                        title={item.isActive ? 'Deactivate account' : 'Reactivate account'}
                        className={`p-2 rounded-lg transition-colors ${
                          item.isActive
                            ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {item.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AsyncState>

      {/* 1. Modal: Add Team Member */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Add Team Member"
        description="Provision a new staff account with a designated security role and temporary credentials."
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="s.jenkins@auraestates.com"
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Security Role <span className="text-rose-400">*</span>
            </label>
            <select
              value={createForm.roleId}
              onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            >
              <option value="">-- Select Role --</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} {r.description ? `(${r.description})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="+1 (555) 019-2834"
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Initial Temporary Password <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Regenerate
              </button>
            </div>
            <input
              type="text"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/60"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Provide these temporary credentials to the staff member. They will sign in at /login.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateOpen(false)}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmitting} icon={createSubmitting ? RefreshCw : UserPlus}>
              {createSubmitting ? 'Provisioning...' : 'Provision Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Modal: Edit User Access */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Team Member Access"
        description={`Modify security role, active status, or reset credentials for ${editingUser?.fullName || 'staff member'}.`}
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={editForm.fullName}
              onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          {/* Role selector - hidden/disabled for protected users */}
          {!editingUser?.isDeveloper && !editingUser?.isOwner && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Security Role
              </label>
              <select
                value={editForm.roleId}
                onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
              >
                <option value="">-- No Role Assigned --</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active status Switch */}
          {!editingUser?.isDeveloper && !editingUser?.isOwner && (
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200">Account Status</span>
                <p className="text-[11px] text-slate-400">
                  {editForm.isActive ? 'Active staff member' : 'Account deactivated (login suspended)'}
                </p>
              </div>
              <Switch
                checked={editForm.isActive}
                onChange={() => setEditForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                size="sm"
              />
            </div>
          )}

          {/* Reset password field */}
          <div className="pt-2 border-t border-white/10">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reset Password (Leave blank to keep unchanged)
            </label>
            <input
              type="password"
              value={editForm.newPassword}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              placeholder="Minimum 8 characters..."
              className="w-full px-3.5 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsEditOpen(false)}
              disabled={editSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editSubmitting}>
              {editSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog: Deactivate / Delete */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, targetUser: null, action: 'deactivate' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'deactivate'
            ? 'Deactivate Team Member?'
            : confirmDialog.action === 'activate'
            ? 'Reactivate Team Member?'
            : 'Permanently Remove Member?'
        }
        description={`Are you sure you want to ${confirmDialog.action} ${
          confirmDialog.targetUser?.fullName || 'this account'
        }? ${
          confirmDialog.action === 'deactivate'
            ? 'Their active sessions and permissions will be suspended immediately.'
            : ''
        }`}
        confirmLabel={
          confirmDialog.action === 'deactivate'
            ? 'Deactivate Account'
            : confirmDialog.action === 'activate'
            ? 'Reactivate'
            : 'Permanently Delete'
        }
        variant={confirmDialog.action === 'deactivate' || confirmDialog.action === 'delete' ? 'danger' : 'info'}
        loading={actionLoading}
      />
    </div>
  );
}
