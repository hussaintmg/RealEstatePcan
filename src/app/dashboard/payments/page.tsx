'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  FileText,
  DollarSign,
  User,
  Building,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AsyncState, AccessDeniedState } from '@/components/ui/AsyncState';
import { formatMoney } from '@/lib/money';

interface PaymentItem {
  _id: string;
  transactionReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  paidAt: string;
  notes?: string;
  invoiceId?: {
    _id: string;
    invoiceNumber: string;
    amount: number;
    balance: number;
    status: string;
    milestoneTitle?: string;
  };
  customerId?: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  dealId?: {
    _id: string;
    title: string;
    agreedPrice: number;
    currency: string;
  };
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
}

const PAYMENT_METHODS = [
  { key: 'wire_transfer', label: 'Wire / Bank Transfer' },
  { key: 'credit_card', label: 'Credit Card / Online' },
  { key: 'bank_deposit', label: 'Cashier Deposit Slip' },
  { key: 'cheque', label: 'Bank Cheque / Pay Order' },
  { key: 'cash', label: 'Cash In Hand' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Unpaid Invoices for selection
  const [invoices, setInvoices] = useState<any[]>([]);

  // Record Form Fields
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('wire_transfer');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Refund dialog state
  const [refundDialog, setRefundDialog] = useState<{
    isOpen: boolean;
    paymentId: string | null;
    reference: string;
  }>({
    isOpen: false,
    paymentId: null,
    reference: '',
  });

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/payments?${params.toString()}`);
      if (res.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch payments ledger.');

      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Error loading payments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const loadUnpaidInvoices = async () => {
    try {
      const res = await fetch('/api/invoices?limit=50&status=pending');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (e) {
      console.error('Failed loading invoices:', e);
    }
  };

  const handleOpenRecord = () => {
    loadUnpaidInvoices();
    setIsRecordModalOpen(true);
  };

  const handleSelectInvoice = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i._id === invId);
    if (inv) {
      setAmount(inv.balance || inv.amount || 0);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedInvoiceId) {
      setFormError('Please select an invoice.');
      return;
    }
    if (!amount || amount <= 0) {
      setFormError('Amount must be greater than zero.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoiceId,
          amount,
          paymentMethod,
          transactionReference: transactionReference.trim() || undefined,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to record payment.');
      }

      setIsRecordModalOpen(false);
      setSelectedInvoiceId('');
      setAmount(0);
      setTransactionReference('');
      setNotes('');
      fetchPayments();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundDialog.paymentId) return;
    try {
      setActionLoading(true);
      const res = await fetch(`/api/payments/${refundDialog.paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Reversed via staff ledger' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to reverse payment.');
      }
      setRefundDialog({ isOpen: false, paymentId: null, reference: '' });
      fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Error processing refund');
    } finally {
      setActionLoading(false);
    }
  };

  if (accessDenied) {
    return (
      <AccessDeniedState
        title="Payment Ledger Restricted"
        message="Your security role does not permit access to financial receipts and payment records."
      />
    );
  }

  const selectedInvObj = invoices.find((i) => i._id === selectedInvoiceId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Transactions Ledger"
        description="Audit recorded customer payments, reconcile milestone demands, and maintain ledger integrity."
        actions={
          <Button onClick={handleOpenRecord} icon={Plus} className="shadow-lg shadow-emerald-500/20">
            Record Payment
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
              placeholder="Search reference..."
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed / Settled</option>
            <option value="refunded">Refunded / Reversed</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Total Transactions: <span className="text-emerald-400 font-semibold">{total}</span>
        </div>
      </div>

      {/* Transactions Table */}
      <AsyncState
        status={loading ? 'loading' : error ? 'error' : payments.length === 0 ? 'empty' : 'success'}
        errorMessage={error}
        emptyTitle="No payments recorded"
        emptyDescription="Record customer receipts against outstanding invoices by clicking Record Payment."
        onRetry={fetchPayments}
      >
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50 shadow-xl">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Invoice</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Method</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p) => {
                const methodLabel = PAYMENT_METHODS.find((m) => m.key === p.paymentMethod)?.label || p.paymentMethod;
                const isRefunded = p.status === 'refunded';

                return (
                  <tr key={p._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-mono font-medium text-emerald-400 text-xs">
                      {p.transactionReference}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white text-xs">
                        {p.invoiceId?.invoiceNumber || 'N/A'}
                      </div>
                      {p.invoiceId?.milestoneTitle && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                          {p.invoiceId.milestoneTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-white font-medium text-xs">
                        {p.customerId?.fullName || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">{p.customerId?.phone}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-300">
                      {methodLabel}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">
                      {new Date(p.paidAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-white text-sm">
                      {formatMoney(p.amount, p.currency)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                          isRefunded
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isRefunded && (
                        <button
                          onClick={() =>
                            setRefundDialog({
                              isOpen: true,
                              paymentId: p._id,
                              reference: p.transactionReference,
                            })
                          }
                          className="text-xs text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reverse</span>
                        </button>
                      )}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Customer Payment Receipt"
        size="lg"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-300 mb-1">Target Invoice *</label>
            <select
              required
              value={selectedInvoiceId}
              onChange={(e) => handleSelectInvoice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">-- Select Pending Invoice --</option>
              {invoices.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.invoiceNumber} — {inv.customerId?.fullName} (Due: {formatMoney(inv.balance || inv.amount, inv.currency)})
                </option>
              ))}
            </select>
          </div>

          {selectedInvObj && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/10 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Total Due: {formatMoney(selectedInvObj.amount, selectedInvObj.currency)}</span>
              <span className="text-emerald-400 font-bold">Remaining Balance: {formatMoney(selectedInvObj.balance, selectedInvObj.currency)}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Payment Amount *</label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Payment Method *</label>
              <select
                required
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Transaction Reference (Optional)</label>
            <input
              type="text"
              value={transactionReference}
              onChange={(e) => setTransactionReference(e.target.value)}
              placeholder="e.g. WIRE-882319-PK (Auto-generated if left blank)"
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">Notes / Ledger Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Deposit slip verified by accounts branch."
              className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
            <Button type="button" variant="outline" onClick={() => setIsRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={actionLoading} className="shadow-lg shadow-emerald-500/20">
              Confirm Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Refund */}
      <ConfirmationDialog
        isOpen={refundDialog.isOpen}
        onClose={() => setRefundDialog({ isOpen: false, paymentId: null, reference: '' })}
        onConfirm={handleConfirmRefund}
        title="Reverse Payment Receipt"
        description={`Are you sure you want to reverse payment transaction ${refundDialog.reference}? This will mark the record as refunded and restore the balance on the associated invoice.`}
        confirmLabel="Confirm Reversal"
        variant="danger"
        loading={actionLoading}
      />
    </div>
  );
}
