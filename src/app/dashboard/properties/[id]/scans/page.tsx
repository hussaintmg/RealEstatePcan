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
  UploadCloud,
  RefreshCw,
  Eye,
  ChevronRight,
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
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'workspace'>('list');

  const fetchScans = async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/scans`);
      const json = await res.json();
      if (json.success) {
        setScans(json.data);
        if (json.data.length > 0) {
          if (!selectedScan) {
            setSelectedScan(json.data[0]);
          } else {
            // keep selectedScan up to date
            const updated = json.data.find((s: any) => s._id === selectedScan._id);
            if (updated) setSelectedScan(updated);
          }
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
    setError('');
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
        setError(json.error || 'Could not initiate scan session');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRetryScan = async (scanId: string) => {
    setRetryingId(scanId);
    setError('');
    try {
      const res = await fetch(`/api/scans/${scanId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.success) {
        await fetchScans();
      } else {
        setError(json.error || 'Failed to retry reconstruction');
      }
    } catch (err: any) {
      setError(err.message || 'Retry request failed');
    } finally {
      setRetryingId(null);
    }
  };

  const handleDeleteScan = async (scanId: string) => {
    if (!confirm('Are you sure you want to permanently delete this spatial scan and its 3D artifacts?')) return;
    try {
      const res = await fetch(`/api/scans/${scanId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setScans((prev) => prev.filter((s) => s._id !== scanId));
        if (selectedScan?._id === scanId) {
          const remaining = scans.filter((s) => s._id !== scanId);
          setSelectedScan(remaining.length > 0 ? remaining[0] : null);
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 text-[11px] font-medium rounded-full shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-950/70 border border-blue-700/80 text-blue-300 text-[11px] font-medium rounded-full animate-pulse shrink-0">
            <Clock className="w-3 h-3 text-blue-400" /> Processing
          </span>
        );
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-950/70 border border-amber-700/80 text-amber-300 text-[11px] font-medium rounded-full shrink-0">
            <Clock className="w-3 h-3 text-amber-400" /> Uploading
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-950/70 border border-red-700/80 text-red-300 text-[11px] font-medium rounded-full shrink-0">
            <XCircle className="w-3 h-3 text-red-400" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium rounded-full shrink-0">
            <Clock className="w-3 h-3 text-slate-400" /> Queued / Draft
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-10">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <Link
            href={`/dashboard/properties/${propertyId}`}
            className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Property Details
          </Link>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">AI Spatial Property Scanning</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Mobile camera capture, neural 3D walkthroughs, and 2D vector floor plan synthesis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScans}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Refresh Scans"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStartScan}
            disabled={creating}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4" />
            {creating ? 'Opening Scanner...' : 'Start New Scan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-3.5 bg-red-950/60 border border-red-800 text-red-300 text-xs sm:text-sm rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-xs text-red-400 hover:text-red-200">Dismiss</button>
        </div>
      )}

      {/* Mobile Tab Switcher (< lg screens) */}
      <div className="max-w-7xl mx-auto mt-4 flex lg:hidden bg-slate-900 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'list' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Scans ({scans.length})
        </button>
        <button
          onClick={() => setMobileTab('workspace')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileTab === 'workspace' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Workspace
        </button>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mt-6">
        {/* Scans List Drawer */}
        <div className={`lg:col-span-4 flex flex-col gap-4 ${mobileTab === 'workspace' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Captured Sessions</h2>
            <span className="text-xs text-slate-500">{scans.length} total</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800/60">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
              Loading spatial scans...
            </div>
          ) : scans.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
              <Camera className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-300">No scans recorded yet</p>
              <p className="text-xs text-slate-500 mt-1">Click &quot;Start New Scan&quot; to open the guided mobile camera or upload room media.</p>
              <button
                onClick={handleStartScan}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
              >
                Start First Scan
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {scans.map((scan) => {
                const isSelected = selectedScan?._id === scan._id;
                const isDraftOrQueued = scan.status === 'draft' || scan.status === 'uploading' || scan.status === 'queued';
                const isFailed = scan.status === 'failed';

                return (
                  <div
                    key={scan._id}
                    onClick={() => {
                      setSelectedScan(scan);
                      setMobileTab('workspace');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-blue-500/80 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/40'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Card Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-white truncate flex-1 min-w-0" title={scan.title}>
                        {scan.title}
                      </h3>
                      {getStatusBadge(scan.status)}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] text-slate-400 mt-2.5">
                      <div>Rooms: <span className="text-white font-mono">{scan.roomsCount || 0}</span></div>
                      <div>Frames: <span className="text-white font-mono">{scan.totalFramesCount || 0}</span></div>
                      <div>Stage: <span className="text-blue-400 capitalize">{scan.currentStage || 'Draft'}</span></div>
                      <div>Date: <span className="text-slate-300">{new Date(scan.createdAt).toLocaleDateString()}</span></div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/60">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {scan.totalSizeBytes ? `${(scan.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB` : '0 MB'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {/* Resume / Re-upload Button for Draft/Uploading Scans */}
                        {isDraftOrQueued && (
                          <Link
                            href={`/dashboard/properties/${propertyId}/scans/capture?scanId=${scan._id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[11px] font-semibold border border-blue-500/30 transition-all"
                            title="Resume capture or re-upload queued frames"
                          >
                            <UploadCloud className="w-3 h-3" />
                            <span>Resume</span>
                          </Link>
                        )}

                        {/* Retry Button for Failed Scans */}
                        {isFailed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetryScan(scan._id);
                            }}
                            disabled={retryingId === scan._id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-[11px] font-semibold border border-amber-500/30 transition-all cursor-pointer"
                            title="Retry reconstruction job"
                          >
                            <RotateCcw className={`w-3 h-3 ${retryingId === scan._id ? 'animate-spin' : ''}`} />
                            <span>Retry</span>
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScan(scan._id);
                          }}
                          className="p-1 hover:text-red-400 text-slate-500 rounded transition-colors cursor-pointer"
                          title="Delete scan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Scan Workspace */}
        <div className={`lg:col-span-8 flex flex-col gap-6 ${mobileTab === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {selectedScan ? (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6">
              {/* If scan is NOT ready: show dedicated Incomplete / Queued Status Banner */}
              {selectedScan.status !== 'ready' ? (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-400">
                    {selectedScan.status === 'draft' || selectedScan.status === 'uploading' ? (
                      <UploadCloud className="w-10 h-10 text-blue-400 animate-bounce" />
                    ) : selectedScan.status === 'processing' ? (
                      <Clock className="w-10 h-10 text-blue-400 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-10 h-10 text-rose-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-white">{selectedScan.title}</h3>
                      {getStatusBadge(selectedScan.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                      {selectedScan.status === 'draft' || selectedScan.status === 'uploading'
                        ? `This scan session is currently queued or in draft (${selectedScan.totalFramesCount || 0} frames). Click below to resume capture, add room photos, or upload.`
                        : selectedScan.status === 'processing'
                        ? `3D Neural reconstruction is in progress (Stage: ${selectedScan.currentStage || 'processing'}). Point clouds and 3D meshes will appear once finalized.`
                        : 'Reconstruction encountered an issue. You can retry the reconstruction worker or re-upload the frames.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    {(selectedScan.status === 'draft' || selectedScan.status === 'uploading' || selectedScan.status === 'queued') && (
                      <Link
                        href={`/dashboard/properties/${propertyId}/scans/capture?scanId=${selectedScan._id}`}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
                        Resume Capture & Upload
                      </Link>
                    )}

                    {selectedScan.status === 'failed' && (
                      <button
                        onClick={() => handleRetryScan(selectedScan._id)}
                        disabled={retryingId === selectedScan._id}
                        className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                      >
                        <RotateCcw className={`w-4 h-4 ${retryingId === selectedScan._id ? 'animate-spin' : ''}`} />
                        Retry Reconstruction
                      </button>
                    )}

                    <button
                      onClick={fetchScans}
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-medium border border-slate-700 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Status
                    </button>
                  </div>
                </div>
              ) : (
                /* Ready State: 3D Walkthrough & Floor Plan Workspace */
                <div>
                  {/* Workspace Navigation Tabs with safe wrapping and zero collisions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3 mb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setActiveTab('3d_viewer')}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                          activeTab === '3d_viewer'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Box className="w-4 h-4" /> 3D Spatial Walkthrough
                      </button>
                      <button
                        onClick={() => setActiveTab('floor_plan')}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                          activeTab === 'floor_plan'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        <Layers className="w-4 h-4" /> 2D Vector Floor Plan
                      </button>
                    </div>

                    <Link
                      href={`/viewer/${selectedScan._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-blue-400 hover:text-blue-300 font-medium transition-all self-start sm:self-auto"
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
              )}
            </div>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center bg-slate-900/20 border border-slate-800/60 rounded-2xl text-slate-500 p-6 text-center">
              <Camera className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm font-medium text-slate-400">Select a scan session from the list to inspect 3D models and floor plans</p>
              <p className="text-xs text-slate-600 mt-1">Or click &quot;Start New Scan&quot; to capture a new property room.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
