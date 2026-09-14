'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, ColumnDef } from '@/components/datagrid/DataGrid';
import { UserCheck, CheckCircle2, Copy, X, Loader2, Mail, Phone } from 'lucide-react';

export default function LeadsDashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Conversion Success Modal
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLeads(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setLeads([]);
    }
  }, [currentPage, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleConvertLead = async (leadId: string) => {
    setConvertingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setConversionResult(data.data);
        fetchLeads();
      }
    } finally {
      setConvertingId(null);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'fullName',
      header: 'Prospect / Client',
      render: (item) => (
        <div>
          <div className="font-semibold text-white">{item.fullName}</div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
            <span className="flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>{item.email}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-slate-500" />
              <span>{item.phone}</span>
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'budget',
      header: 'Budget',
      render: (item) => (
        <span className="font-bold text-emerald-400">
          ${item.budget ? item.budget.toLocaleString() : 'Negotiable'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            item.status === 'converted'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : item.status === 'new'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Conversion Action',
      render: (item) => {
        if (item.status === 'converted') {
          return (
            <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Customer</span>
            </span>
          );
        }

        const isConverting = convertingId === item._id;
        return (
          <button
            onClick={() => handleConvertLead(item._id)}
            disabled={isConverting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {isConverting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserCheck className="w-3.5 h-3.5" />
            )}
            <span>1-Click Convert</span>
          </button>
        );
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">VIP Leads &amp; Conversion Pipeline</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          One-click conversion securely registers customers and provides User Portal access credentials.
        </p>
      </div>

      <DataGrid
        title="Incoming Leads Pipeline"
        data={leads}
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
              { label: 'New', value: 'new' },
              { label: 'Contacted', value: 'contacted' },
              { label: 'Negotiating', value: 'negotiating' },
              { label: 'Converted', value: 'converted' },
            ],
          },
        ]}
      />

      {/* Conversion Credentials Modal */}
      {conversionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#101522] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Customer Provisioned Successfully</span>
              </div>
              <button
                onClick={() => setConversionResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              The prospect has been upgraded to a Customer account. Share these credentials with the client to access the User Portal:
            </p>

            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl font-mono text-xs space-y-2 text-slate-200">
              <div>
                <span className="text-slate-500">Portal URL:</span>{' '}
                <span className="text-blue-400">/portal</span>
              </div>
              <div>
                <span className="text-slate-500">Email:</span>{' '}
                <span className="text-white font-semibold">{conversionResult.user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500">Password:</span>{' '}
                  <span className="text-amber-300 font-bold">{conversionResult.generatedPassword}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Email: ${conversionResult.user.email}\nPassword: ${conversionResult.generatedPassword}\nPortal: ${window.location.origin}/login`
                    );
                  }}
                  className="p-1 text-slate-400 hover:text-white"
                  title="Copy credentials"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setConversionResult(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
