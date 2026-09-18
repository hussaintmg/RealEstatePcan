'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  Mail,
  Phone,
  DollarSign,
  Building,
  UserPlus,
  Share2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';

interface LeadItem {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  budget?: number;
  status: 'new' | 'contacted' | 'negotiating' | 'converted' | 'lost';
  source: string;
  notes?: string;
  propertyInterest?: {
    _id: string;
    title: string;
    price: number;
    currency: string;
  };
  assignedAgent?: {
    _id: string;
    fullName: string;
    email: string;
  };
  convertedToCustomer?: string;
  createdAt: string;
}

const LEAD_STATUSES = [
  { key: '', label: 'All Statuses' },
  { key: 'new', label: 'New Inquiries', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'contacted', label: 'Contacted', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'negotiating', label: 'In Negotiation', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { key: 'converted', label: 'Converted to Customer', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'lost', label: 'Lost / Inactive', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

export default function LeadsDashboardPage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [activeLeadForAssign, setActiveLeadForAssign] = useState<LeadItem | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState('');

  // Conversion Success Modal
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Add Lead Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState<number | ''>('');
  const [source, setSource] = useState('manual');
  const [propertyInterest, setPropertyInterest] = useState('');
  const [notes, setNotes] = useState('');

  // Selectable properties & agents
  const [properties, setProperties] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLeads(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch leads.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading leads pipeline');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const loadPropertiesAndAgents = async () => {
    try {
      const [pRes, uRes] = await Promise.all([
        fetch('/api/properties?limit=50'),
        fetch('/api/users?limit=50'),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProperties(pData.properties || []);
      }
      if (uRes.ok) {
        const uData = await uRes.json();
        setAgents(uData.users || []);
      }
    } catch (e) {
      console.error('Failed loading dependencies:', e);
    }
  };

  const handleOpenAdd = () => {
    loadPropertiesAndAgents();
    setIsAddModalOpen(true);
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setFormError('Name, email, and phone are required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          budget: budget ? Number(budget) : 0,
          source,
          propertyInterest: propertyInterest || undefined,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to register lead.');
      }

      setIsAddModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      setBudget('');
      setNotes('');
      fetchLeads();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add lead.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAssign = (lead: LeadItem) => {
    loadPropertiesAndAgents();
    setActiveLeadForAssign(lead);
    setSelectedAgentId(lead.assignedAgent?._id || '');
    setIsAssignModalOpen(true);
  };

  const handleAssignLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLeadForAssign) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/leads/${activeLeadForAssign._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedAgent: selectedAgentId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reassign agent.');
      }
      setIsAssignModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Assignment failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertLead = async (leadId: string) => {
    setConvertingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Lead conversion failed.');
      }
      setConversionResult(data.data);
      fetchLeads();
    } catch (err: any) {
      alert(err.message || 'Error converting lead.');
    } finally {
      setConvertingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  if (accessDenied) {
    return (
      <AccessDeniedState
        title="Leads Pipeline Restricted"
        message="Your security role does not permit access to client leads and inquiries."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="VIP Leads & Conversion Pipeline"
        description="Capture prospective buyer inquiries, assign sales agents, log communications, and convert qualified prospects into verified customers."
        actions={
          <Button onClick={handleOpenAdd} icon={Plus} className="shadow-lg shadow-emerald-500/20">
            Add Lead
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search leads by name, email, phone..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Leads: <span className="text-emerald-400 font-semibold">{totalItems}</span>
        </div>
      </div>

      {/* Main Grid */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : leads.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No leads found"
        emptyDescription="Register new inquiries directly or connect website lead forms."
        onRetry={fetchLeads}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const statusConfig = LEAD_STATUSES.find((s) => s.key === lead.status) || LEAD_STATUSES[1];
            const isConverting = convertingId === lead._id;

            return (
              <div
                key={lead._id}
                className="bg-slate-900/50 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${statusConfig.color}`}>
                      {lead.status}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {lead.budget ? `$${lead.budget.toLocaleString()}` : 'Budget Open'}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-1">{lead.fullName}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{lead.phone}</span>
                    </div>

                    {lead.propertyInterest && (
                      <div className="pt-2 border-t border-white/5 flex items-center gap-2 text-slate-300">
                        <Building className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{lead.propertyInterest.title}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenAssign(lead)}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lead.assignedAgent?.fullName || 'Unassigned'}</span>
                  </button>

                  <div>
                    {lead.status === 'converted' ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Customer</span>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        loading={isConverting}
                        onClick={() => handleConvertLead(lead._id)}
                        className="text-xs py-1 px-2.5 shadow-md shadow-emerald-500/10"
                      >
                        Convert
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400 px-3 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </AsyncState>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Direct Lead Registration"
        size="lg"
      >
        <form onSubmit={handleAddLead} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Client full name"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Budget ($)</label>
              <input
                type="number"
                min="0"
                value={budget}
                onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 500000"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="manual">Manual Entry</option>
                <option value="phone">Inbound Phone Call</option>
                <option value="whatsapp">WhatsApp Direct</option>
                <option value="referral">Client Referral</option>
                <option value="website">Website Form</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Interested Property Unit</label>
            <select
              value={propertyInterest}
              onChange={(e) => setPropertyInterest(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- General Buyer Inquiry (No Unit) --</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} (${p.price?.toLocaleString()} - {p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Initial Inquiry Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Inquired about corner villa with private pool and flexible installment schedule."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
              Save Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Lead Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Lead to Sales Agent"
        size="md"
      >
        <form onSubmit={handleAssignLead} className="space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-2">
              Assigning prospect: <span className="text-white font-semibold">{activeLeadForAssign?.fullName}</span>
            </div>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Unassigned --</option>
              {agents.map((ag) => (
                <option key={ag._id} value={ag._id}>
                  {ag.fullName} ({ag.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Conversion Success Modal */}
      {conversionResult && (
        <Modal
          isOpen={!!conversionResult}
          onClose={() => setConversionResult(null)}
          title="Lead Converted to Customer"
          size="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Customer Account Established</h4>
              <p className="text-xs text-slate-400 mt-1">
                Client {conversionResult.customer?.fullName} is now registered in the CRM.
              </p>
            </div>

            <div className="p-4 bg-slate-950/60 rounded-xl border border-white/10 text-left space-y-2 text-xs font-mono">
              <div className="text-slate-400">
                Email: <span className="text-white">{conversionResult.customer?.email}</span>
              </div>
              <div className="text-slate-400">
                Temporary Key: <span className="text-emerald-400 font-bold">{conversionResult.generatedPassword}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Portal Invite Token: <span className="truncate block text-slate-400">{conversionResult.portalInviteToken}</span>
              </div>
            </div>

            <Button
              onClick={() => copyToClipboard(conversionResult.portalInviteToken)}
              icon={copiedToken ? Check : Copy}
              className="w-full shadow-lg shadow-emerald-500/20"
            >
              {copiedToken ? 'Copied Invitation Token' : 'Copy Portal Activation Token'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
