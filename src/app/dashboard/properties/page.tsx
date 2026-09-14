'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, ColumnDef } from '@/components/datagrid/DataGrid';
import { DirectUploader } from '@/components/common/DirectUploader';
import { Plus, X, Building, Check, Loader2 } from 'lucide-react';

export default function PropertiesDashboardPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    price: '',
    propertyType: 'Villa',
    status: 'available',
    address: '',
    city: 'Islamabad',
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 3500,
    model3dUrl: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20', // Strict 20 items per page
        sortBy: sortKey,
        sortDir,
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProperties(data.items || []);
        setTotalItems(data.totalItems || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch {
      setProperties([]);
    }
  }, [currentPage, search, statusFilter, sortKey, sortDir]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          price: Number(form.price),
          propertyType: form.propertyType,
          status: form.status,
          location: { address: form.address, city: form.city },
          specs: {
            bedrooms: Number(form.bedrooms),
            bathrooms: Number(form.bathrooms),
            areaSqFt: Number(form.areaSqFt),
          },
          model3dUrl: form.model3dUrl,
          description: form.description,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: '',
          price: '',
          propertyType: 'Villa',
          status: 'available',
          address: '',
          city: 'Islamabad',
          bedrooms: 4,
          bathrooms: 4,
          areaSqFt: 3500,
          model3dUrl: '',
          description: '',
        });
        fetchProperties();
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'title',
      header: 'Listing Title',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-semibold text-white">{item.title}</div>
          <div className="text-[11px] text-slate-400">{item.location?.city} • {item.propertyType}</div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (item) => (
        <span className="font-bold text-emerald-400">
          ${item.price?.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
            item.status === 'available'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-slate-700 text-slate-300'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      key: 'specs',
      header: 'Specifications',
      render: (item) => (
        <span className="text-slate-300 text-[11px]">
          {item.specs?.bedrooms || 3} Beds • {item.specs?.bathrooms || 2} Baths • {item.specs?.areaSqFt} sq ft
        </span>
      ),
    },
    {
      key: 'model3dUrl',
      header: '3D PlayCanvas',
      render: (item) =>
        item.model3dUrl ? (
          <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
            GLB Active
          </span>
        ) : (
          <span className="text-[10px] text-slate-500">Procedural 3D</span>
        ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Properties &amp; 3D PlayCanvas Models
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict 20-row backend pagination with persistent cross-page selection and bulk execution.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Property Listing</span>
        </button>
      </div>

      <DataGrid
        title="Active Catalog"
        data={properties}
        columns={columns}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        onSearchChange={(term) => setSearch(term)}
        onFilterChange={(k, v) => setStatusFilter(v)}
        onSortChange={(k, dir) => {
          setSortKey(k);
          setSortDir(dir);
        }}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Available', value: 'available' },
              { label: 'Sold', value: 'sold' },
              { label: 'Pending', value: 'pending' },
            ],
          },
        ]}
        onBulkDelete={async (ids) => {
          // Parallel bulk delete simulation
          await new Promise((r) => setTimeout(r, 400));
        }}
        onBulkExportPdf={async (ids) => {
          await new Promise((r) => setTimeout(r, 500));
        }}
      />

      {/* New Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#101522] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white">Create New Real Estate Listing</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="The Skyview Horizon Villa"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Price ($)</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="1850000"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Property Type</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              {/* Direct 3D Model Uploader */}
              <div>
                <label className="block text-slate-300 mb-1">
                  Upload PlayCanvas 3D Model (.glb / .gltf)
                </label>
                <DirectUploader
                  folder="models"
                  accept=".glb,.gltf"
                  label="Upload 3D Architectural GLB Model (Direct Bufferless Upload)"
                  onUploadComplete={(url) => setForm({ ...form, model3dUrl: url })}
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Architectural features, finishes, panoramic views..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Publish Listing</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
