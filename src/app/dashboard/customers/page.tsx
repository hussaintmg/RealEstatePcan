'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  FileText,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';

interface CustomerItem {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'active' | 'archived';
  portalStatus?: 'pending_invite' | 'invited' | 'active' | 'disabled';
  linkedProperties?: any[];
  invoices?: any[];
  notes?: string;
  createdAt: string;
}

export default function CustomersDashboardPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');

  // Modals & Detail State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [linkedPropertyId, setLinkedPropertyId] = useState('');
  const [properties, setProperties] = useState<any[]>([]);

  // Invite state
  const [inviteModalData, setInviteModalData] = useState<{
    isOpen: boolean;
    token: string;
    expiresAt: string;
    customerName: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
      });
      if (search.trim()) params.append('search', search.trim());

      const res = await fetch(`/api/customers?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setCustomers(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch customers.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading customers list');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const loadProperties = async () => {
    try {
      const res = await fetch('/api/properties?limit=50');
      if (res.ok) {
        const data = await res.json();
        setProperties(data.properties || []);
      }
    } catch (e) {
      console.error('Failed loading properties:', e);
    }
  };

  const handleOpenAdd = () => {
    loadProperties();
    setIsAddModalOpen(true);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      setFormError('Full name, email, and phone are required.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          notes: notes.trim(),
          linkedPropertyId: linkedPropertyId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create customer account.');
      }

      setIsAddModalOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setNotes('');
      setLinkedPropertyId('');
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create customer.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCustomerDetails = async (cust: CustomerItem) => {
    try {
      setCustomerDetailsLoading(true);
      setSelectedCustomer(cust);
      const res = await fetch(`/api/customers/${cust._id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCustomer(data.customer || cust);
      }
    } finally {
      setCustomerDetailsLoading(false);
    }
  };

  const handleInviteToPortal = async (customerId: string, customerName: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/customers/${customerId}/invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to issue invitation.');
      }
      setInviteModalData({
        isOpen: true,
        token: data.token,
        expiresAt: data.expiresAt,
        customerName,
      });
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Error generating portal invitation');
    } finally {
      setActionLoading(false);
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
        title="Customer Accounts Restricted"
        message="Your security role does not permit access to verified customer records."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verified Client Accounts"
        description="Manage onboarded buyers, manage portal accounts, issue access credentials, and monitor client portfolios."
        actions={
          <Button onClick={handleOpenAdd} icon={Plus} className="shadow-lg shadow-emerald-500/20">
            Add Customer
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search customers by name, email, phone..."
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Customers: <span className="text-emerald-400 font-semibold">{totalItems}</span>
        </div>
      </div>

      {/* Main Grid */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : customers.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No customer accounts"
        emptyDescription="Directly register buyer profiles or convert qualified prospects from the Leads pipeline."
        onRetry={fetchCustomers}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => {
            const isPortalActive = cust.portalStatus === 'active';
            const isInvited = cust.portalStatus === 'invited';

            return (
              <div
                key={cust._id}
                className="bg-slate-900/50 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                        isPortalActive
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isInvited
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                      }`}
                    >
                      Portal: {cust.portalStatus?.replace('_', ' ') || 'Pending Invite'}
                    </span>

                    <span className="text-xs font-mono text-slate-400">
                      {cust.linkedProperties?.length || 0} Units
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-white mt-1">{cust.fullName}</h3>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleInviteToPortal(cust._id, cust.fullName)}
                    disabled={actionLoading}
                    className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isInvited ? 'Resend Invite' : 'Invite Portal'}</span>
                  </button>

                  <button
                    onClick={() => handleOpenCustomerDetails(cust)}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
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

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Verified Client"
        size="md"
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Buyer legal name"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Link Initial Property Unit</label>
            <select
              value={linkedPropertyId}
              onChange={(e) => setLinkedPropertyId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- No Unit Link (General Buyer) --</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title} (${p.price?.toLocaleString()} - {p.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Client KYC / Operational Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Identity verified via CNIC/Passport."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile Inspection Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Client Profile: ${selectedCustomer.fullName}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400">Email:</span>
                <div className="font-semibold text-white truncate">{selectedCustomer.email}</div>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <div className="font-semibold text-white">{selectedCustomer.phone}</div>
              </div>
              <div>
                <span className="text-slate-400">Portal Access:</span>
                <div className="font-semibold text-emerald-400 uppercase">
                  {selectedCustomer.portalStatus || 'Pending'}
                </div>
              </div>
            </div>

            {selectedCustomer.notes && (
              <div className="p-3 bg-slate-900/40 rounded-xl border border-white/5 text-xs text-slate-300">
                <span className="font-semibold text-slate-400 block mb-1">KYC Notes:</span>
                {selectedCustomer.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleInviteToPortal(selectedCustomer._id, selectedCustomer.fullName)}
              >
                Issue Portal Invitation Link
              </Button>
              <Button size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Portal Invite Modal */}
      {inviteModalData && (
        <Modal
          isOpen={inviteModalData.isOpen}
          onClose={() => setInviteModalData(null)}
          title="Customer Portal Invitation Issued"
          size="md"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Activation Token Ready</h4>
              <p className="text-xs text-slate-400 mt-1">
                Provide this cryptographically signed invitation link to {inviteModalData.customerName}.
                The token expires in 7 days.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 text-left font-mono text-xs">
              <div className="text-slate-400 text-[11px] mb-1">Invitation Token:</div>
              <div className="text-emerald-400 break-all">{inviteModalData.token}</div>
            </div>

            <Button
              onClick={() => copyToClipboard(inviteModalData.token)}
              icon={copiedToken ? Check : Copy}
              className="w-full shadow-lg shadow-emerald-500/20"
            >
              {copiedToken ? 'Copied Invitation Token' : 'Copy Activation Token'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
