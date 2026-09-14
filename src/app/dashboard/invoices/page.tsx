'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, ColumnDef } from '@/components/datagrid/DataGrid';
import { Plus, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function InvoicesDashboardPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setInvoices([]);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      render: (item) => (
        <span className="font-mono font-bold text-blue-400 text-xs">
          {item.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-white text-xs">
          ${item.amount?.toLocaleString()} {item.currency || 'USD'}
        </span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (item) => (
        <span className="text-slate-300 text-xs">
          {new Date(item.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Payment Status',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            item.status === 'paid'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : item.status === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
          }`}
        >
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Milestone Invoices &amp; Billing</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real estate transaction escrow deposits, construction milestones, and receipts.
          </p>
        </div>
      </div>

      <DataGrid
        title="Active Invoices"
        data={invoices}
        columns={columns}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(p) => setCurrentPage(p)}
        onSearchChange={(s) => setSearch(s)}
        onFilterChange={(k, v) => setStatusFilter(v)}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Overdue', value: 'overdue' },
            ],
          },
        ]}
      />
    </div>
  );
}
