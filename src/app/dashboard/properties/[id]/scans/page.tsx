'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Camera,
  Layers,
  Box,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  ArrowLeft,
  Share2,
  Maximize2,
  Sliders,
  Play,
  XCircle,
} from 'lucide-react';
import ThreeSpatialViewer from '@/components/scanning/ThreeSpatialViewer';
import FloorPlanVectorEditor from '@/components/scanning/FloorPlanVectorEditor';

export default function PropertyScansPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [scans, setScans] = useState<any[]>([]);
  const [selectedScan, setSelectedScan] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'3d_viewer' | 'floor_plan' | 'calibration'>('3d_viewer');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchScans = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/scans`);
      const json = await res.json();
      if (json.success) {
        setScans(json.data);
        if (json.data.length > 0 && !selectedScan) {
          setSelectedScan(json.data[0]);
        }
      } else {
        setError(json.error || 'Failed to load property scans');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading scans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchScans();
    }
  }, [propertyId]);

  const handleStartScan = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Spatial Scan ${new Date().toLocaleDateString()}` }),
      });
      const json = await res.json();
      if (json.success) {
        router.push(`/dashboard/properties/${propertyId}/scans/capture?scanId=${json.data._id}`);
      } else {
        setError(json.error || 'Could not initiate scan');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to permanently delete this spatial scan and its 3D models?')) return;
    try {
      const res = await fetch(`/api/scans/${scanId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setScans((prev) => prev.filter((s) => s._id !== scanId));
        if (selectedScan?._id === scanId) {
          setSelectedScan(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/60 border border-blue-800 text-blue-400 text-xs rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Processing
          </span>
        );
      case 'uploading':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/60 border border-amber-800 text-amber-400 text-xs rounded-full">
            <Clock className="w-3.5 h-3.5" /> Uploading
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 border border-red-800 text-red-400 text-xs rounded-full">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-300 text-xs rounded-full">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <Link
            href={`/dashboard/properties/${propertyId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Property Details
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AI Spatial Property Scanning</h1>
          <p className="text-slate-400 text-sm mt-1">
            Capture mobile camera scans, reconstruct neural 3D walkthroughs, and synthesize 2D floor plans.
          </p>
        </div>

        <button
          onClick={handleStartScan}
          disabled={creating}
          className="flex items-center gap-2.5 px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          <Camera className="w-5 h-5" />
          {creating ? 'Initializing Scanner...' : 'Start New Scan'}
        </button>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mt-6 p-4 bg-red-950/40 border border-red-800 text-red-300 text-sm rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Scans List Drawer */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Captured Sessions</h2>

          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading scans...</div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <Camera className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No scans recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;Start New Scan&quot; to open the guided mobile camera.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scans.map((scan) => (
                <div
                  key={scan._id}
                  onClick={() => setSelectedScan(scan)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedScan?._id === scan._id
                      ? 'bg-slate-900 border-blue-500/80 shadow-lg shadow-blue-900/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-white truncate max-w-[180px]">{scan.title}</h3>
                    {getStatusBadge(scan.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-3">
                    <div>Rooms: <span className="text-white font-mono">{scan.roomsCount || 0}</span></div>
                    <div>Frames: <span className="text-white font-mono">{scan.totalFramesCount || 0}</span></div>
                    <div>Stage: <span className="text-blue-400 capitalize">{scan.currentStage || 'Draft'}</span></div>
                    <div>Created: <span className="text-slate-400">{new Date(scan.createdAt).toLocaleDateString()}</span></div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
                    <span className="text-[11px] text-slate-500">
                      {(scan.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScan(scan._id);
                      }}
                      className="p-1 hover:text-red-400 text-slate-500 rounded transition-colors"
                      title="Delete scan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Scan Workspace */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {selectedScan ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              {/* Workspace Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('3d_viewer')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === '3d_viewer'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Box className="w-4 h-4" /> 3D Spatial Walkthrough
                  </button>
                  <button
                    onClick={() => setActiveTab('floor_plan')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'floor_plan'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" /> 2D Vector Floor Plan
                  </button>
                </div>

                <Link
                  href={`/viewer/${selectedScan._id}`}
                  target="_blank"
                  className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Standalone Fullscreen
                </Link>
              </div>

              {/* Tab Contents */}
              {activeTab === '3d_viewer' ? (
                <div>
                  <ThreeSpatialViewer
                    scanId={selectedScan._id}
                    rooms={[
                      { id: '1', name: 'Living Hall', center: { x: 0, y: 0, z: 0 }, areaSqFt: 320 },
                      { id: '2', name: 'Master Suite', center: { x: 5, y: 0, z: 1 }, areaSqFt: 215 },
                    ]}
                  />
                </div>
              ) : (
                <div>
                  <FloorPlanVectorEditor scanId={selectedScan._id} />
                </div>
              )}
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center bg-slate-900/20 border border-slate-800/60 rounded-2xl text-slate-500">
              Select or create a scan to inspect 3D models and floor plans.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
