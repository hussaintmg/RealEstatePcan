'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { DataGrid, ColumnDef } from '@/components/datagrid/DataGrid';
import { DirectUploader } from '@/components/common/DirectUploader';
import { Plus, Building, Check, Camera, Layers, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

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
          <Link
            href={`/dashboard/properties/${item._id}/scans`}
            className="font-semibold text-white hover:text-blue-400 transition-colors inline-flex items-center gap-1.5 group"
            title="Open Scans & 3D Models for this Property"
          >
            <span>{item.title}</span>
            <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </Link>
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
      key: 'actions',
      header: 'Live Camera & 3D Actions',
      render: (item) => (
        <div className="flex items-center gap-1.5 py-1">
          {/* Direct Camera Scan Button */}
          <Link
            href={`/dashboard/properties/${item._id}/scans/capture`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-blue-600/30 hover:shadow-blue-500/50 transition-all border border-blue-400/40"
            title="Open Live Camera Scanner for this Property"
          >
            <Camera className="w-3.5 h-3.5 animate-pulse text-blue-200" />
            <span>Camera Scan</span>
          </Link>

          {/* Scans & Floor Plans List */}
          <Link
            href={`/dashboard/properties/${item._id}/scans`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all hover:text-white"
            title="View Scans, 3D Models & 2D Floor Plans"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Plans</span>
          </Link>

          {/* PlayCanvas 3D Studio */}
          <Link
            href={`/dashboard/properties/${item._id}/3d`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-100 text-xs font-medium rounded-lg border border-purple-500/30 transition-all"
            title="Open PlayCanvas 3D Studio"
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span>3D Studio</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Properties & 3D PlayCanvas Models"
        description="Strict 20-row backend pagination with persistent cross-page selection, camera scanning, and 3D walkthroughs."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Properties' },
        ]}
        primaryAction={
          <div className="flex items-center gap-2.5">
            {properties.length > 0 && (
              <Link
                href={`/dashboard/properties/${properties[0]._id}/scans/capture`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all border border-blue-400/40 cursor-pointer"
                title="Launch Live Camera Scanner"
              >
                <Camera className="w-4 h-4 animate-pulse text-blue-200" />
                <span>Launch Camera Scanner</span>
              </Link>
            )}
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Property Listing
            </Button>
          </div>
        }
      />

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
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Real Estate Listing"
        description="Publish residential or commercial property listing with optional 3D asset"
        size="lg"
      >
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
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              loadingText="Publishing..."
            >
              Publish Listing
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
