'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Building,
  User,
  TrendingUp,
  X,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Columns,
  LayoutGrid,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';
import { formatMoney } from '@/lib/money';

interface MilestoneItem {
  title: string;
  percentage: number;
  amount: number;
  dueDate?: string;
  status: 'pending' | 'invoiced' | 'paid';
  invoiceId?: string;
}

interface DealItem {
  _id: string;
  title: string;
  stage: string;
  dealValue: number;
  agreedPrice: number;
  bookingAmount: number;
  discount: number;
  currency: string;
  propertyId?: {
    _id: string;
    title: string;
    slug: string;
    price: number;
    currency: string;
    location?: { address?: string; city?: string };
    status: string;
  };
  customerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    portalStatus?: string;
  };
  assignedAgentId?: {
    _id: string;
    fullName: string;
    email: string;
  };
  milestones: MilestoneItem[];
  invoices?: any[];
  expectedCloseDate?: string;
  notes?: string;
  createdAt: string;
}

const STAGES = [
  { key: '', label: 'All Stages' },
  { key: 'inquiry', label: 'Inquiry / Exploration', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  { key: 'viewing_scheduled', label: 'Viewing Scheduled', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { key: 'offer_submitted', label: 'Offer Submitted', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { key: 'under_contract', label: 'Under Contract (Reserved)', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { key: 'deposit_received', label: 'Deposit Received', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { key: 'closed_won', label: 'Closed Won (Sold)', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { key: 'closed_lost', label: 'Closed Lost (Released)', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'grid'>('pipeline');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<DealItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Properties & Customers for selection
  const [properties, setProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Create Deal Form
  const [formTitle, setFormTitle] = useState('');
  const [formPropertyId, setFormPropertyId] = useState('');
  const [formCustomerId, setFormCustomerId] = useState('');
  const [formDealValue, setFormDealValue] = useState<number>(500000);
  const [formBookingAmount, setFormBookingAmount] = useState<number>(50000);
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formMilestones, setFormMilestones] = useState<
    { title: string; percentage: number; amount: number; dueDate: string }[]
  >([
    { title: 'Booking Deposit', percentage: 10, amount: 50000, dueDate: '' },
    { title: 'Ground Floor Slab', percentage: 30, amount: 150000, dueDate: '' },
    { title: 'Structure Completion', percentage: 30, amount: 150000, dueDate: '' },
    { title: 'Handover & Final Settlement', percentage: 30, amount: 150000, dueDate: '' },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Deals
  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (selectedStage) params.set('stage', selectedStage);

      const res = await fetch(`/api/deals?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch sales deals pipeline.');
      }
      const data = await res.json();
      setDeals(data.deals || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error loading deals');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedStage]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Load properties and customers when opening create modal
  const loadSelectableEntities = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/properties?limit=50'),
        fetch('/api/customers?limit=50'),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        setProperties(pData.properties || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData.customers || []);
      }
    } catch (e) {
      console.error('Failed loading selectables:', e);
    }
  };

  const handleOpenCreate = () => {
    loadSelectableEntities();
    setIsCreateModalOpen(true);
  };

  // Recalculate milestone amounts when deal value changes
  const handleDealValueChange = (val: number) => {
    setFormDealValue(val);
    setFormMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        amount: Math.round((val * m.percentage) / 100),
      }))
    );
  };

  const handleMilestonePercentageChange = (index: number, pct: number) => {
    setFormMilestones((prev) => {
      const updated = [...prev];
      updated[index].percentage = pct;
      updated[index].amount = Math.round((formDealValue * pct) / 100);
      return updated;
    });
  };

  const handleAddMilestoneRow = () => {
    setFormMilestones((prev) => [
      ...prev,
      { title: `Milestone ${prev.length + 1}`, percentage: 0, amount: 0, dueDate: '' },
    ]);
  };

  const handleRemoveMilestoneRow = (index: number) => {
    setFormMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const totalMilestonePercentage = formMilestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formTitle.trim()) {
      setFormError('Deal title is required.');
      return;
    }
    if (!formPropertyId) {
      setFormError('Please select a property unit.');
      return;
    }
    if (!formCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (totalMilestonePercentage !== 100) {
      setFormError(`Milestone percentages must sum exactly to 100% (Current sum: ${totalMilestonePercentage}%).`);
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          propertyId: formPropertyId,
          customerId: formCustomerId,
          dealValue: formDealValue,
          bookingAmount: formBookingAmount,
          currency: formCurrency,
          paymentPlanType: 'milestone_plan',
          milestones: formMilestones.map((m, idx) => ({
            title: m.title,
            percentage: m.percentage,
            amount: m.amount,
            dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
            sequence: idx + 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to create deal.');
      }

      setIsCreateModalOpen(false);
      fetchDeals();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create deal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Stage advancement
  const handleAdvanceStage = async (dealId: string, newStage: string) => {
    try {
      setActionLoading(true);
      const res = await fetch(`/api/deals/${dealId}/stage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to update deal stage.');
      }
      if (selectedDeal && selectedDeal._id === dealId) {
        setSelectedDeal(data.deal);
      }
      fetchDeals();
    } catch (err: any) {
      alert(err.message || 'Error updating stage');
    } finally {
      setActionLoading(false);
    }
  };

  // Generate invoice for milestone
  const handleGenerateMilestoneInvoice = async (dealId: string, milestoneIndex: number) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, milestoneIndex }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to issue invoice for this milestone.');
      }
      alert(`Invoice ${data.invoice.invoiceNumber} successfully issued for milestone!`);
      // Refresh deal detail
      const dRes = await fetch(`/api/deals/${dealId}`);
      if (dRes.ok) {
        const dData = await dRes.json();
        setSelectedDeal(dData.deal);
      }
      fetchDeals();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <AccessDeniedState
        title="Deals Access Restricted"
        message="Your security role does not permit access to the Sales and Deals pipeline."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals & Sales Pipeline"
        description="Track property purchase contracts, unit reservations, milestone payment plans, and closing handovers."
        actions={
          <Button onClick={handleOpenCreate} icon={Plus} className="shadow-lg shadow-emerald-500/20">
            Create Deal
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
              placeholder="Search deals by title..."
              size="sm"
            />
          </div>
          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key} className="bg-slate-900 text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 border border-white/10 rounded-xl p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'pipeline'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Pipeline (Horizontal)</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Total Deals: <span className="text-emerald-400 font-semibold">{total}</span>
          </div>
        </div>
      </div>

      {/* Main Deals Content */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : deals.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No deals found"
        emptyDescription="Start a new property reservation or sale transaction by clicking Create Deal."
        onRetry={fetchDeals}
      >
        {viewMode === 'pipeline' ? (
          <div className="flex gap-3.5 overflow-x-auto pb-2 custom-scrollbar min-h-[460px]">
            {STAGES.filter((s) => s.key !== '').map((stage) => {
              const stageDeals = deals.filter((d) => d.stage === stage.key);
              const stageTotal = stageDeals.reduce((acc, d) => acc + (d.dealValue || 0), 0);

              return (
                <div
                  key={stage.key}
                  className="w-72 sm:w-80 flex-shrink-0 bg-slate-900/40 border border-white/5 rounded-2xl p-3.5 flex flex-col space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${stage.key === 'closed_won' ? 'bg-emerald-400' : stage.key === 'closed_lost' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                      <span className="text-xs font-bold text-white tracking-tight">{stage.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                      {stageDeals.length}
                    </span>
                  </div>

                  {stageDeals.length > 0 && (
                    <div className="text-[10px] font-mono text-emerald-400 font-semibold px-1">
                      Stage Volume: ${stageTotal.toLocaleString()}
                    </div>
                  )}

                  <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-270px)] pr-1 custom-scrollbar">
                    {stageDeals.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-white/5 rounded-xl text-slate-500 text-[11px]">
                        No deals in this stage
                      </div>
                    ) : (
                      stageDeals.map((deal) => {
                        const paidCount = deal.milestones?.filter((m) => m.status === 'paid').length || 0;

                        return (
                          <div
                            key={deal._id}
                            onClick={() => setSelectedDeal(deal)}
                            className="bg-slate-950/70 border border-white/10 hover:border-emerald-500/40 rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-xs font-bold text-white line-clamp-1 flex-1">{deal.title}</h4>
                              <span className="text-xs font-mono text-emerald-400 font-bold shrink-0">
                                {formatMoney(deal.dealValue, deal.currency)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-400 space-y-1">
                              <div className="flex items-center gap-1.5 truncate">
                                <Building className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{deal.propertyId?.title || 'Unassigned'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{deal.customerId?.fullName || 'Unlinked'}</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Milestones: {paidCount}/{deal.milestones?.length || 0} Paid</span>
                              <span className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5">
                                Details <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {deals.map((deal) => {
              const stageConfig = STAGES.find((s) => s.key === deal.stage) || STAGES[1];
              const invoicedCount = deal.milestones?.filter((m) => m.status === 'invoiced' || m.status === 'paid').length || 0;
              const paidCount = deal.milestones?.filter((m) => m.status === 'paid').length || 0;

              return (
                <div
                  key={deal._id}
                  onClick={() => setSelectedDeal(deal)}
                  className="bg-slate-900/50 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-xl hover:shadow-emerald-500/5 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${stageConfig.color}`}>
                        {stageConfig.label}
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">
                        {formatMoney(deal.dealValue, deal.currency)}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-white line-clamp-1">{deal.title}</h3>

                    <div className="mt-2.5 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 font-medium truncate">
                          {deal.propertyId?.title || 'Unassigned Property'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-300 truncate">
                          {deal.customerId?.fullName || 'Unlinked Customer'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                    <span>Milestones: {paidCount}/{deal.milestones?.length || 0} Paid</span>
                    <div className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                      View Details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs text-slate-400 px-3 font-mono">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </AsyncState>

      {/* Deal Detail Inspection Drawer / Modal */}
      {selectedDeal && (
        <Modal
          isOpen={!!selectedDeal}
          onClose={() => setSelectedDeal(null)}
          title={selectedDeal.title}
          size="xl"
        >
          <div className="space-y-6">
            {/* Header / Stage Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/60 rounded-xl border border-white/10">
              <div>
                <div className="text-xs text-slate-400 mb-1">Current Stage</div>
                <div className="text-sm font-semibold text-emerald-400 uppercase">
                  {selectedDeal.stage.replace('_', ' ')}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Advance Stage:</span>
                <select
                  value={selectedDeal.stage}
                  onChange={(e) => handleAdvanceStage(selectedDeal._id, e.target.value)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-slate-900 border border-white/15 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {STAGES.filter((s) => s.key).map((s) => (
                    <option key={s.key} value={s.key} className="bg-slate-900">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="text-[11px] text-slate-400">Agreed Price</div>
                <div className="text-base font-bold text-white mt-1">
                  {formatMoney(selectedDeal.agreedPrice || selectedDeal.dealValue, selectedDeal.currency)}
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="text-[11px] text-slate-400">Booking Deposit</div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  {formatMoney(selectedDeal.bookingAmount, selectedDeal.currency)}
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="text-[11px] text-slate-400">Property Status</div>
                <div className="text-base font-bold text-slate-200 mt-1 uppercase">
                  {selectedDeal.propertyId?.status || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
                <div className="text-[11px] text-slate-400">Customer</div>
                <div className="text-sm font-semibold text-slate-200 mt-1 truncate">
                  {selectedDeal.customerId?.fullName || 'N/A'}
                </div>
              </div>
            </div>

            {/* Milestone Payment Schedule */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Milestone Payment Schedule
                </h4>
                <span className="text-xs text-slate-400">
                  {selectedDeal.milestones?.length || 0} Planned Milestones
                </span>
              </div>

              <div className="space-y-2">
                {selectedDeal.milestones?.map((milestone, idx) => {
                  const isPaid = milestone.status === 'paid';
                  const isInvoiced = milestone.status === 'invoiced';

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/40 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                          <span className="text-sm font-medium text-white">{milestone.title}</span>
                          <span className="text-xs text-slate-400 font-mono">({milestone.percentage}%)</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Amount: <span className="text-emerald-400 font-semibold">{formatMoney(milestone.amount, selectedDeal.currency)}</span>
                          {milestone.dueDate && (
                            <span className="ml-3">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isInvoiced
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                          }`}
                        >
                          {milestone.status}
                        </span>

                        {!isPaid && !isInvoiced && (
                          <Button
                            size="sm"
                            variant="secondary"
                            loading={actionLoading}
                            onClick={() => handleGenerateMilestoneInvoice(selectedDeal._id, idx)}
                            className="text-xs py-1"
                          >
                            Issue Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Deal Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initiate Property Sale / Deal"
        size="lg"
      >
        <form onSubmit={handleCreateDeal} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">Deal Title *</label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Unit 402 - Luxury Waterfront Villa Sale"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Property Unit *</label>
              <select
                required
                value={formPropertyId}
                onChange={(e) => {
                  setFormPropertyId(e.target.value);
                  const p = properties.find((item) => item._id === e.target.value);
                  if (p && p.price) {
                    handleDealValueChange(p.price);
                    if (p.currency) setFormCurrency(p.currency);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Property --</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.currency || 'USD'} {p.price?.toLocaleString()} - {p.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Customer / Buyer *</label>
              <select
                required
                value={formCustomerId}
                onChange={(e) => setFormCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.fullName} ({c.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Agreed Price *</label>
              <input
                type="number"
                min="1"
                required
                value={formDealValue}
                onChange={(e) => handleDealValueChange(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Booking Deposit</label>
              <input
                type="number"
                min="0"
                value={formBookingAmount}
                onChange={(e) => setFormBookingAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Currency</label>
              <input
                type="text"
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
              />
            </div>
          </div>

          {/* Milestone Plan Builder */}
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200">Payment Milestones (Must total 100%)</span>
              <Button type="button" size="sm" variant="outline" onClick={handleAddMilestoneRow}>
                Add Milestone
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {formMilestones.map((m, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={m.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormMilestones((prev) => {
                        const updated = [...prev];
                        updated[idx].title = val;
                        return updated;
                      });
                    }}
                    placeholder="Milestone title"
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
                  />
                  <div className="w-20 flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={m.percentage}
                      onChange={(e) => handleMilestonePercentageChange(idx, Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono text-right"
                    />
                    <span className="text-xs text-slate-400 ml-1">%</span>
                  </div>
                  <div className="w-28 text-right font-mono text-xs text-emerald-400">
                    {formatMoney(m.amount, formCurrency)}
                  </div>
                  {formMilestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestoneRow(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs mt-2 font-mono">
              <span className={totalMilestonePercentage === 100 ? 'text-emerald-400' : 'text-rose-400'}>
                Total Percentage: {totalMilestonePercentage}%
              </span>
              <span className="text-slate-400">
                Total Value: {formatMoney(formDealValue, formCurrency)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={actionLoading}
              disabled={totalMilestonePercentage !== 100}
              className="shadow-lg shadow-emerald-500/20"
            >
              Confirm Deal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
