'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, ColumnDef } from '@/components/datagrid/DataGrid';
import { UserCheck, Mail, Phone, Home, FileText } from 'lucide-react';

export default function CustomersDashboardPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
      });
      if (search) params.append('search', search);

      const res = await fetch(`/api/customers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setCustomers([]);
    }
  }, [currentPage, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'fullName',
      header: 'Verified Client',
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
      key: 'linkedProperties',
      header: 'Linked Estates',
      render: (item) => (
        <span className="text-blue-400 font-semibold text-xs flex items-center space-x-1">
          <Home className="w-3.5 h-3.5" />
          <span>{item.linkedProperties?.length || 0} Property Listed</span>
        </span>
      ),
    },
    {
      key: 'invoices',
      header: 'Active Invoices',
      render: (item) => (
        <span className="text-purple-300 font-semibold text-xs flex items-center space-x-1">
          <FileText className="w-3.5 h-3.5" />
          <span>{item.invoices?.length || 0} Invoices</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Portal Status',
      render: (item) => (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {item.status || 'Active'}
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Verified Customer Directory</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Clients converted from leads with active User Portal access and contract milestones.
        </p>
      </div>

      <DataGrid
        title="Client Accounts"
        data={customers}
        columns={columns}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(p) => setCurrentPage(p)}
        onSearchChange={(s) => setSearch(s)}
      />
    </div>
  );
}
