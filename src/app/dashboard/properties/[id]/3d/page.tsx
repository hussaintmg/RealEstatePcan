'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlayCanvasViewer } from '@/components/3d/PlayCanvasViewer';
import {
  Compass,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Layers,
  MapPin,
  Sparkles,
  Camera,
  CheckCircle2,
  Loader2,
  Box,
  Eye,
} from 'lucide-react';

export default function Property3DStudioPage() {
  const { id } = useParams();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'model' | 'waypoints' | 'hotspots' | 'floors'>('model');

  const [experience, setExperience] = useState({
    title: '3D Spatial Architectural Walkthrough',
    modelUrl: '',
    format: 'glb',
    lightingPreset: 'golden_hour',
    isPublished: true,
    waypoints: [] as Array<{ id: string; name: string; position: [number, number, number]; lookAt: [number, number, number]; duration: number }>,
    hotspots: [] as Array<{ id: string; title: string; description: string; specs: string; position: [number, number, number] }>,
    floorMappings: [] as Array<{ floorId: string; label: string; nodeName: string; levelIndex: number; elevation: number }>,
  });

  useEffect(() => {
    fetch(`/api/properties/${propertyId}/3d`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.experience) {
          setExperience((prev) => ({
            ...prev,
            ...data.experience,
          }));
        }
      })
      .catch((err) => console.error('Error fetching 3D experience:', err))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/properties/${propertyId}/3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experience),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error saving 3D experience:', err);
    } finally {
      setSaving(false);
    }
  };

  const addWaypoint = () => {
    const newWp = {
      id: `wp-${Date.now()}`,
      name: `Viewpoint ${experience.waypoints.length + 1}`,
      position: [0, 3, 7] as [number, number, number],
      lookAt: [0, 1, 0] as [number, number, number],
      duration: 3.5,
    };
    setExperience({ ...experience, waypoints: [...experience.waypoints, newWp] });
  };

  const removeWaypoint = (index: number) => {
    setExperience({
      ...experience,
      waypoints: experience.waypoints.filter((_, i) => i !== index),
    });
  };

  const addHotspot = () => {
    const newHotspot = {
      id: `hs-${Date.now()}`,
      title: 'Architectural Feature',
      description: 'Handcrafted luxury finish with premium detailing.',
      specs: 'Material: Imported Slate',
      position: [0, 1, 0] as [number, number, number],
    };
    setExperience({ ...experience, hotspots: [...experience.hotspots, newHotspot] });
  };

  const removeHotspot = (index: number) => {
    setExperience({
      ...experience,
      hotspots: experience.hotspots.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex items-center justify-center text-slate-400 space-x-3">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="text-sm">Loading 3D Studio...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex flex-col">
      {/* Top Header */}
      <header className="h-16 border-b border-white/10 bg-[#0d121f]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/properties"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center space-x-2.5">
            <Compass className="w-5 h-5 text-blue-400 animate-spin-slow" />
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">PlayCanvas 3D Studio</h1>
              <p className="text-[10px] text-slate-400">Configure Spatial Walkthrough & Hotspots</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveSuccess && (
            <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in duration-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>3D Experience Saved</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Experience</span>
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left 3D Viewport */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-black/40">
            <PlayCanvasViewer modelUrl={experience.modelUrl} title={experience.title} className="h-full w-full" />
          </div>
        </div>

        {/* Right Configuration Inspector */}
        <div className="w-full lg:w-96 border-l border-white/10 bg-[#0d121f] flex flex-col h-full">
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 p-2 gap-1 bg-white/[0.02]">
            <button
              onClick={() => setActiveTab('model')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'model' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Model & GLB
            </button>
            <button
              onClick={() => setActiveTab('waypoints')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'waypoints' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Waypoints
            </button>
            <button
              onClick={() => setActiveTab('hotspots')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'hotspots' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hotspots
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {activeTab === 'model' && (
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
                  <label className="block text-slate-300 font-semibold mb-1.5">GLB / GLTF Model Asset URL</label>
                  <input
                    type="text"
                    value={experience.modelUrl}
                    onChange={(e) => setExperience({ ...experience, modelUrl: e.target.value })}
                    placeholder="https://.../model.glb or /models/villa.glb"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload via Media Library or supply an external GLB container asset. Leave empty to use the procedural villa preset.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Lighting Environment Preset</label>
                  <select
                    value={experience.lightingPreset}
                    onChange={(e) => setExperience({ ...experience, lightingPreset: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#101522] border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="golden_hour">Golden Hour (Warm Architectural Sunlight)</option>
                    <option value="twilight_night">Twilight Night (Moody Blue Glow)</option>
                    <option value="studio_bright">Studio Bright (High Contrast Neutral)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/10 rounded-xl">
                  <div>
                    <span className="block font-semibold text-white">Publish 3D Experience</span>
                    <span className="text-[10px] text-slate-400">Expose to public property pages and CMS Page Builder</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={experience.isPublished}
                    onChange={(e) => setExperience({ ...experience, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 bg-white/5 border-white/10"
                  />
                </div>
              </div>
            )}

            {activeTab === 'waypoints' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Cinematic Camera Waypoints</span>
                  <button
                    onClick={addWaypoint}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Waypoint</span>
                  </button>
                </div>

                {experience.waypoints.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px] text-center py-6">No custom waypoints defined. The default 5-point tour will play.</p>
                ) : (
                  <div className="space-y-3">
                    {experience.waypoints.map((wp, i) => (
                      <div key={wp.id} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={wp.name}
                            onChange={(e) => {
                              const updated = [...experience.waypoints];
                              updated[i].name = e.target.value;
                              setExperience({ ...experience, waypoints: updated });
                            }}
                            className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            onClick={() => removeWaypoint(i)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                          <div>
                            <span>X: {wp.position[0]}</span>
                          </div>
                          <div>
                            <span>Y: {wp.position[1]}</span>
                          </div>
                          <div>
                            <span>Z: {wp.position[2]}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'hotspots' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">Interactive 3D Hotspots</span>
                  <button
                    onClick={addHotspot}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Hotspot</span>
                  </button>
                </div>

                {experience.hotspots.length === 0 ? (
                  <p className="text-slate-500 italic text-[11px] text-center py-6">No custom hotspots configured.</p>
                ) : (
                  <div className="space-y-3">
                    {experience.hotspots.map((hs, i) => (
                      <div key={hs.id} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={hs.title}
                            onChange={(e) => {
                              const updated = [...experience.hotspots];
                              updated[i].title = e.target.value;
                              setExperience({ ...experience, hotspots: updated });
                            }}
                            className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-full"
                          />
                          <button
                            onClick={() => removeHotspot(i)}
                            className="text-slate-500 hover:text-rose-400 p-1 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={hs.description}
                          placeholder="Feature description..."
                          onChange={(e) => {
                            const updated = [...experience.hotspots];
                            updated[i].description = e.target.value;
                            setExperience({ ...experience, hotspots: updated });
                          }}
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-[10px]"
                        />
                        <input
                          type="text"
                          value={hs.specs}
                          placeholder="Technical specs..."
                          onChange={(e) => {
                            const updated = [...experience.hotspots];
                            updated[i].specs = e.target.value;
                            setExperience({ ...experience, hotspots: updated });
                          }}
                          className="w-full px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-blue-400 text-[10px] font-mono"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
