'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  RealEstate3DViewer,
  HotspotItem,
  CameraBookmark,
  FloorMapping,
  UnitMapping,
} from '@/components/3d/RealEstate3DViewer';
import { HierarchyInspector } from '@/components/3d/HierarchyInspector';
import { MappingPanel } from '@/components/3d/MappingPanel';
import { HotspotEditor } from '@/components/3d/HotspotEditor';
import { CameraBookmarksEditor } from '@/components/3d/CameraBookmarksEditor';
import {
  Compass,
  ArrowLeft,
  LayoutDashboard,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Send,
  Layers,
  Sparkles,
  RefreshCw,
  Sun,
  ShieldAlert,
} from 'lucide-react';
import { GlbMetadata, HierarchyNode } from '@/lib/3d/types';

export default function Property3DStudioPage() {
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Viewer Mode: 'editor' | 'preview'
  const [viewerMode, setViewerMode] = useState<'editor' | 'preview'>('editor');

  // Active Inspector Tab
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'camera' | 'mappings' | 'hotspots' | 'environment'>('hierarchy');
  // Mobile studio view switcher ('viewport' | 'inspector')
  const [mobileStudioView, setMobileStudioView] = useState<'viewport' | 'inspector'>('viewport');

  // 3D Experience State
  const [experience, setExperience] = useState({
    title: '3D Spatial Architectural Walkthrough',
    status: 'ready',
    currentVersion: 1,
    publishedVersion: 1,
    isPublished: false,
    modelUrl: '',
    sourceAsset: null as any,
    modelMetadata: null as GlbMetadata | null,
    cameraSettings: {
      defaultPosition: [0, 3, 7] as [number, number, number],
      defaultTarget: [0, 1, 0] as [number, number, number],
      fov: 55,
      minDistance: 1.5,
      maxDistance: 60,
      minPitch: -10,
      maxPitch: 85,
    },
    sceneSettings: {
      rootTransform: {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
      },
      environmentPreset: 'golden_hour' as any,
      exposure: 1.0,
      ambientIntensity: 0.6,
      shadowQuality: 'medium' as any,
    },
    bookmarks: [] as CameraBookmark[],
    hotspots: [] as HotspotItem[],
    floorMappings: [] as FloorMapping[],
    unitMappings: [] as UnitMapping[],
  });

  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);

  // Live Camera Tracking from Viewer
  const [currentLiveCamera, setCurrentLiveCamera] = useState<{
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
  }>({
    position: [0, 3, 7],
    target: [0, 1, 0],
    fov: 55,
  });

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load experience on mount
  useEffect(() => {
    fetch(`/api/properties/${propertyId}/3d`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.experience) {
          setExperience((prev) => ({
            ...prev,
            ...data.experience,
          }));
          if (data.experience.modelMetadata?.namedNodes) {
            // Reconstruct minimal hierarchy if not returned directly
            setHierarchy(
              data.experience.modelMetadata.namedNodes.map((name: string, i: number) => ({
                name,
                index: i,
                path: name,
                children: [],
              }))
            );
          }
        }
      })
      .catch((err) => console.error('Error fetching 3D experience:', err))
      .finally(() => setLoading(false));
  }, [propertyId]);

  // Handle Save
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/3d`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: experience.title,
          sceneSettings: experience.sceneSettings,
          cameraSettings: experience.cameraSettings,
          bookmarks: experience.bookmarks,
          hotspots: experience.hotspots,
          floorMappings: experience.floorMappings,
          unitMappings: experience.unitMappings,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMessage(data.error || 'Failed to save experience');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    setPublishing(true);
    setPublishMessage(null);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/properties/${propertyId}/3d/publish`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setExperience((prev) => ({
          ...prev,
          isPublished: true,
          status: 'published',
          publishedVersion: data.experience.publishedVersion,
        }));
        setPublishMessage(`Version ${data.experience.publishedVersion} successfully published to public website!`);
        setTimeout(() => setPublishMessage(null), 4000);
      } else {
        setErrorMessage(data.error || 'Failed to publish 3D experience');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Handle GLB Upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/properties/${propertyId}/3d/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.experience) {
        setExperience((prev) => ({
          ...prev,
          ...data.experience,
        }));
        if (data.hierarchy) {
          setHierarchy(data.hierarchy);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm">Loading PlayCanvas 3D Studio...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="min-h-16 py-2.5 sm:py-0 border-b border-white/10 bg-[#0d121f]/95 backdrop-blur-md px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <Link
            href="/dashboard/properties"
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
            title="Back to Properties"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all border border-white/10 shrink-0"
            title="Return to Main Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-400" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <Compass className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 animate-spin-slow shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">PlayCanvas 3D Studio</h1>
                <span
                  className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shrink-0 ${
                    experience.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : experience.status === 'configuration_required'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  v{experience.currentVersion}
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 truncate">Configure Walkthrough, Floor/Unit Mappings & Hotspots</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {saveSuccess && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}

          {publishMessage && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-emerald-400 font-semibold px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{publishMessage}</span>
            </span>
          )}

          {errorMessage && (
            <span className="hidden sm:inline-flex items-center space-x-1 text-xs text-rose-400 font-semibold px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </span>
          )}

          {/* Mode Switcher */}
          <button
            onClick={() => setViewerMode(viewerMode === 'editor' ? 'preview' : 'editor')}
            className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              viewerMode === 'preview'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title={viewerMode === 'preview' ? 'Exit Visitor Preview' : 'Preview as Visitor'}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{viewerMode === 'preview' ? 'Exit Preview' : 'Preview'}</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-1 px-3 sm:px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save</span>
          </button>

          {/* Publish Button */}
          <button
            onClick={handlePublish}
            disabled={publishing || !experience.modelUrl}
            className="inline-flex items-center space-x-1 px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Publish 3D</span>
            <span className="sm:hidden">Publish</span>
          </button>
        </div>
      </header>

      {/* Mobile Mode Switcher (< lg screens) */}
      <div className="lg:hidden p-2 bg-[#0d121f] border-b border-white/10 flex gap-2">
        <button
          onClick={() => setMobileStudioView('viewport')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileStudioView === 'viewport' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          3D Viewport
        </button>
        <button
          onClick={() => setMobileStudioView('inspector')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
            mobileStudioView === 'inspector' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Inspector Settings ({activeTab})
        </button>
      </div>

      {/* Main Spatial Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center / Left: 3D Viewport */}
        <div className={`flex-1 p-3 sm:p-6 flex flex-col space-y-4 overflow-hidden ${mobileStudioView === 'inspector' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Uploader Card if no model uploaded or replacement desired */}
          {(!experience.modelUrl || uploading || uploadError) && (
            <div className="p-3.5 sm:p-4 bg-[#101522] border border-dashed border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Upload Architectural GLB Container</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">
                    Supports binary glTF 2.0 (.glb) packaging geometry, materials, and textures up to 100MB.
                  </p>
                  {uploadError && <p className="text-[11px] text-rose-400 mt-1">{uploadError}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                  <span>{uploading ? 'Validating...' : 'Select GLB'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive PlayCanvas Viewport */}
          <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-black/40 min-h-[380px] sm:min-h-[460px]">
            <RealEstate3DViewer
              modelUrl={experience.modelUrl}
              title={experience.title}
              cameraSettings={experience.cameraSettings}
              sceneSettings={experience.sceneSettings}
              bookmarks={experience.bookmarks}
              floorMappings={experience.floorMappings}
              unitMappings={experience.unitMappings}
              hotspots={experience.hotspots}
              mode={viewerMode}
              selectedNodeName={selectedNodeName}
              onSelectNode={(nodeName) => setSelectedNodeName(nodeName)}
              onCameraChange={(cam) => setCurrentLiveCamera(cam)}
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Right Configuration Inspector */}
        <div className={`w-full lg:w-96 border-l border-white/10 bg-[#0d121f] flex flex-col h-full z-10 ${mobileStudioView === 'viewport' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Top Inspector Navigation Tabs */}
          <div className="flex border-b border-white/10 p-2 gap-1 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                activeTab === 'hierarchy' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hierarchy
            </button>
            <button
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                activeTab === 'camera' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Camera
            </button>
            <button
              onClick={() => setActiveTab('mappings')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                activeTab === 'mappings' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mappings
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                activeTab === 'hotspots' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hotspots
            </button>
            <button
              onClick={() => setActiveTab('environment')}
              className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                activeTab === 'environment' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Environment
            </button>
          </div>

          {/* Inspector Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {activeTab === 'hierarchy' && (
              <div className="space-y-4">
                {/* Model Quick Actions */}
                <div className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-white/10 rounded-xl">
                  <div>
                    <span className="block font-bold text-white text-[11px]">Replace Model</span>
                    <span className="text-[10px] text-slate-400">Upload a new revision of this building</span>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-white rounded-lg text-[10px] font-semibold border border-white/15 transition-all"
                  >
                    Upload GLB
                  </button>
                </div>

                <HierarchyInspector
                  hierarchy={hierarchy}
                  metadata={experience.modelMetadata || undefined}
                  selectedNodeName={selectedNodeName}
                  onSelectNode={(name) => setSelectedNodeName(name)}
                  onMapNode={(name, type) => {
                    if (type === 'floor') {
                      setExperience((prev) => ({
                        ...prev,
                        floorMappings: [
                          ...prev.floorMappings,
                          {
                            floorId: `fl-${Date.now()}`,
                            floorLabel: `Level ${prev.floorMappings.length + 1}`,
                            nodeName: name,
                            levelIndex: prev.floorMappings.length + 1,
                            elevation: prev.floorMappings.length * 4,
                          },
                        ],
                      }));
                      setActiveTab('mappings');
                    } else {
                      setExperience((prev) => ({
                        ...prev,
                        unitMappings: [
                          ...prev.unitMappings,
                          {
                            propertyUnitId: `unit-${Date.now()}`,
                            unitName: `Residence ${prev.unitMappings.length + 101}`,
                            nodeName: name,
                            price: 1500000,
                            status: 'available',
                            bedrooms: 3,
                            bathrooms: 3,
                            areaSqFt: 2200,
                          },
                        ],
                      }));
                      setActiveTab('mappings');
                    }
                  }}
                />
              </div>
            )}

            {activeTab === 'camera' && (
              <CameraBookmarksEditor
                bookmarks={experience.bookmarks}
                currentCamera={currentLiveCamera}
                defaultPosition={experience.cameraSettings.defaultPosition}
                defaultTarget={experience.cameraSettings.defaultTarget}
                onChangeBookmarks={(bms) => setExperience({ ...experience, bookmarks: bms })}
                onSetDefaultCamera={(pos, target) => {
                  setExperience({
                    ...experience,
                    cameraSettings: {
                      ...experience.cameraSettings,
                      defaultPosition: pos,
                      defaultTarget: target,
                    },
                  });
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 2500);
                }}
                onPreviewBookmark={(pos, target, fov) => {
                  setCurrentLiveCamera({ position: pos, target, fov: fov || 55 });
                }}
              />
            )}

            {activeTab === 'mappings' && (
              <MappingPanel
                floorMappings={experience.floorMappings}
                unitMappings={experience.unitMappings}
                namedNodes={experience.modelMetadata?.namedNodes || []}
                onChangeFloors={(floors) => setExperience({ ...experience, floorMappings: floors })}
                onChangeUnits={(units) => setExperience({ ...experience, unitMappings: units })}
              />
            )}

            {activeTab === 'hotspots' && (
              <HotspotEditor
                hotspots={experience.hotspots}
                currentCameraPos={currentLiveCamera.position}
                onChangeHotspots={(hs) => setExperience({ ...experience, hotspots: hs })}
              />
            )}

            {activeTab === 'environment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">3D Experience Title</label>
                  <input
                    type="text"
                    value={experience.title}
                    onChange={(e) => setExperience({ ...experience, title: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Lighting Environment Preset</label>
                  <select
                    value={experience.sceneSettings.environmentPreset}
                    onChange={(e) =>
                      setExperience({
                        ...experience,
                        sceneSettings: {
                          ...experience.sceneSettings,
                          environmentPreset: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="golden_hour">Golden Hour (Warm Architectural Sunlight)</option>
                    <option value="twilight_night">Twilight Night (Moody Blue Ambience)</option>
                    <option value="studio_bright">Studio Bright (High Contrast Neutral)</option>
                    <option value="sunset">Sunset Glow (Vibrant Crimson & Amber)</option>
                    <option value="dark_presentation">Dark Presentation (Sleek Obsidian)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Shadow Quality</label>
                  <select
                    value={experience.sceneSettings.shadowQuality}
                    onChange={(e) =>
                      setExperience({
                        ...experience,
                        sceneSettings: {
                          ...experience.sceneSettings,
                          shadowQuality: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="high">High Quality (2048x2048 Soft Shadows)</option>
                    <option value="medium">Medium Quality (1024x1024 Filtered)</option>
                    <option value="low">Low Quality (Mobile Optimized)</option>
                    <option value="off">Disabled (Maximum Performance)</option>
                  </select>
                </div>

                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">Exposure Rating</span>
                    <span className="font-mono text-blue-400">{experience.sceneSettings.exposure}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={experience.sceneSettings.exposure}
                    onChange={(e) =>
                      setExperience({
                        ...experience,
                        sceneSettings: {
                          ...experience.sceneSettings,
                          exposure: parseFloat(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
