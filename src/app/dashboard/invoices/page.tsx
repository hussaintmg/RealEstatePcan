'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  CreditCard,
  Ban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';
import { formatMoney } from '@/lib/money';

interface InvoiceItem {
  _id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  balance: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  milestoneTitle?: string;
  customerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  dealId?: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

export default function InvoicesDashboardPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Actions
  const [activeInvoiceForPayment, setActiveInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('wire_transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Void Dialog
  const [voidDialog, setVoidDialog] = useState<{
    isOpen: boolean;
    invoiceId: string | null;
    invoiceNumber: string;
  }>({
    isOpen: false,
    invoiceId: null,
    invoiceNumber: '',
  });
  const [voidReason, setVoidReason] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setInvoices(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch invoices.');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading billing invoices');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleOpenPayment = (inv: InvoiceItem) => {
    setActiveInvoiceForPayment(inv);
    setPaymentAmount(inv.balance || inv.amount);
    setPaymentRef('');
    setFormError(null);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoiceForPayment) return;
    setFormError(null);

    if (paymentAmount <= 0 || paymentAmount > activeInvoiceForPayment.balance) {
      setFormError(`Amount must be between 1 and ${formatMoney(activeInvoiceForPayment.balance, activeInvoiceForPayment.currency)}.`);
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: activeInvoiceForPayment._id,
          amount: paymentAmount,
          paymentMethod,
          transactionReference: paymentRef.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Payment recording failed.');
      }

      setActiveInvoiceForPayment(null);
      fetchInvoices();
    } catch (err: any) {
      setFormError(err.message || 'Payment submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!voidDialog.invoiceId) return;

    try {
      setActionLoading(true);
      const res = await fetch(`/api/invoices/${voidDialog.invoiceId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() || 'Voided by accounts desk' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to void invoice.');
      }

      setVoidDialog({ isOpen: false, invoiceId: null, invoiceNumber: '' });
      setVoidReason('');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Error voiding invoice');
    } finally {
      setActionLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <AccessDeniedState
        title="Billing Records Restricted"
        message="Your security role does not permit access to invoices and billing records."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Milestone Invoices & Billing"
        description="Monitor issued milestone demands, track escrow balances, reconcile customer receipts, and void invalid billing demands."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="w-full sm:w-64">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Search by invoice # or client..."
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
            <option value="">All Statuses</option>
            <option value="pending">Pending Payment</option>
            <option value="paid">Fully Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled / Void</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Invoices: <span className="text-emerald-400 font-semibold">{totalItems}</span>
        </div>
      </div>

      {/* Invoices Table */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : invoices.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No invoices found"
        emptyDescription="Invoices are automatically issued when deal milestones become due."
        onRetry={fetchInvoices}
      >
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Invoice #</th>
                <th className="px-5 py-3.5">Milestone / Deal</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Balance Due</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((inv) => {
                const isPaid = inv.status === 'paid';
                const isCancelled = inv.status === 'cancelled';

                return (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-400 text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-xs">
                        {inv.milestoneTitle || 'Full Settlement'}
                      </div>
                      {inv.dealId && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {inv.dealId.title}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-xs">
                        {inv.customerId?.fullName || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">{inv.customerId?.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium text-white text-xs">
                      {formatMoney(inv.amount, inv.currency)}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatMoney(inv.balance, inv.currency)}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                          isPaid
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : isCancelled
                            ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            : inv.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors inline-flex items-center gap-1 font-medium"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay</span>
                          </button>
                        )}
                        {!isPaid && !isCancelled && (
                          <button
                            onClick={() =>
                              setVoidDialog({
                                isOpen: true,
                                invoiceId: inv._id,
                                invoiceNumber: inv.invoiceNumber,
                              })
                            }
                            className="text-xs text-slate-400 hover:text-rose-400 p-1"
                            title="Void Invoice"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

      {/* Record Payment Modal */}
      {activeInvoiceForPayment && (
        <Modal
          isOpen={!!activeInvoiceForPayment}
          onClose={() => setActiveInvoiceForPayment(null)}
          title={`Record Payment for ${activeInvoiceForPayment.invoiceNumber}`}
          size="md"
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Total: {formatMoney(activeInvoiceForPayment.amount, activeInvoiceForPayment.currency)}</span>
              <span className="text-emerald-400 font-bold">Remaining Balance: {formatMoney(activeInvoiceForPayment.balance, activeInvoiceForPayment.currency)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Payment Amount *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={activeInvoiceForPayment.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="wire_transfer">Wire / Bank Transfer</option>
                  <option value="credit_card">Credit Card / Online</option>
                  <option value="bank_deposit">Cashier Deposit Slip</option>
                  <option value="cheque">Cheque / Pay Order</option>
                  <option value="cash">Cash in Hand</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Transaction Reference (Optional)</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="e.g. WIRE-99823 (Auto-generated if left blank)"
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
              <Button type="button" variant="outline" onClick={() => setActiveInvoiceForPayment(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
                Confirm Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Void Dialog */}
      <ConfirmationDialog
        isOpen={voidDialog.isOpen}
        onClose={() => setVoidDialog({ isOpen: false, invoiceId: null, invoiceNumber: '' })}
        onConfirm={handleConfirmVoid}
        title="Void Billing Demand"
        description={`Are you sure you want to void invoice ${voidDialog.invoiceNumber}? This action is irreversible and recorded in the tamper-evident audit log.`}
        confirmLabel="Void Invoice"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
