'use client';

import React, { useState, useEffect } from 'react';
import { FloorPlanVectorData } from '@/lib/scanning/types';
import { Save, RefreshCw, ZoomIn, ZoomOut, CheckCircle, Edit3 } from 'lucide-react';

interface FloorPlanVectorEditorProps {
  scanId: string;
  initialData?: FloorPlanVectorData;
  onSaveSuccess?: () => void;
}

export const FloorPlanVectorEditor: React.FC<FloorPlanVectorEditorProps> = ({
  scanId,
  initialData,
  onSaveSuccess,
}) => {
  const [data, setData] = useState<FloorPlanVectorData | null>(initialData || null);
  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);

  const fetchFloorPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scans/${scanId}/floorplan`);
      const json = await res.json();
      if (json.success) {
        setData(json.data.vectorData);
        setSvgMarkup(json.data.svgMarkup);
      }
    } catch (err) {
      console.error('Failed to load floor plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchFloorPlan();
    }
  }, [scanId]);

  const handleVertexChange = (roomIdx: number, vertexIdx: number, axis: 'x' | 'y', val: number) => {
    if (!data) return;
    const updated = JSON.parse(JSON.stringify(data)) as FloorPlanVectorData;
    updated.rooms[roomIdx].polygon[vertexIdx][axis] = val;

    // Recalculate area for axis-aligned box
    const poly = updated.rooms[roomIdx].polygon;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of poly) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const len = Math.max(maxX - minX, 1);
    const wid = Math.max(maxY - minY, 1);
    const areaM = Math.round(len * wid * 100) / 100;
    updated.rooms[roomIdx].areaSqMeters = areaM;
    updated.rooms[roomIdx].areaSqFeet = Math.round(areaM * 10.7639 * 10) / 10;

    // Recalculate total
    updated.totalAreaSqMeters = updated.rooms.reduce((a, r) => a + r.areaSqMeters, 0);
    updated.totalAreaSqFeet = Math.round(updated.totalAreaSqMeters * 10.7639 * 10) / 10;

    setData(updated);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch(`/api/scans/${scanId}/floorplan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vectorData: data }),
      });
      const json = await res.json();
      if (json.success) {
        setSaveMessage('Floor plan saved and synchronized with 3D model');
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin mr-3 text-blue-500" />
        Synthesizing 2D Floor Plan...
      </div>
    );
  }

  if (!data || data.rooms.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
        No room boundary vectors available. Please complete room segmentation first.
      </div>
    );
  }

  const currentRoom = data.rooms[selectedRoomIndex] || data.rooms[0];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <Edit3 className="w-5 h-5 text-blue-400" />
          <div>
            <h3 className="text-base font-semibold text-white">Interactive 2D Architectural Floor Plan</h3>
            <p className="text-xs text-slate-400">
              Total Area: <span className="text-blue-400 font-medium">{data.totalAreaSqFeet} sq ft</span> ({data.totalAreaSqMeters} m²)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setScale((s) => Math.max(s - 0.2, 0.6))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300">{Math.round(scale * 100)}%</span>
            <button
              onClick={() => setScale((s) => Math.min(s + 0.2, 2.0))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Revisions
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="px-6 py-2 bg-emerald-950/40 border-b border-emerald-800 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {saveMessage}
        </div>
      )}

      {/* Editor Main Canvas & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[480px]">
        {/* SVG Visual Display */}
        <div className="lg:col-span-3 p-6 flex items-center justify-center bg-slate-900/30 overflow-auto">
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}>
            {svgMarkup ? (
              <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
            ) : (
              <div className="w-[450px] h-[350px] bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                Floor plan preview rendering...
              </div>
            )}
          </div>
        </div>

        {/* Room Inspection & Vertex Tuning Panel */}
        <div className="lg:col-span-1 p-6 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/60 flex flex-col gap-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rooms in Property</h4>
          <div className="flex flex-col gap-2">
            {data.rooms.map((r, idx) => (
              <button
                key={r.id}
                onClick={() => setSelectedRoomIndex(idx)}
                className={`flex items-center justify-between p-3 rounded-lg text-left text-sm transition-colors ${
                  selectedRoomIndex === idx
                    ? 'bg-blue-600/20 border border-blue-500/50 text-white font-medium'
                    : 'bg-slate-800/50 border border-transparent text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{r.name}</span>
                <span className="text-xs text-blue-400">{r.areaSqFeet} sq ft</span>
              </button>
            ))}
          </div>

          <hr className="border-slate-800 my-2" />

          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Edit Boundary Vertices ({currentRoom.name})
          </h4>
          <div className="space-y-3 overflow-y-auto max-h-56 pr-1">
            {currentRoom.polygon.map((vertex, vIdx) => (
              <div key={vIdx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                <div className="font-mono text-slate-400 mb-1.5">Vertex #{vIdx + 1}</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">X (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vertex.x}
                      onChange={(e) =>
                        handleVertexChange(selectedRoomIndex, vIdx, 'x', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Y (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={vertex.y}
                      onChange={(e) =>
                        handleVertexChange(selectedRoomIndex, vIdx, 'y', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FloorPlanVectorEditor;
