'use client';

import React from 'react';
import { Plus, Trash2, Info, MapPin } from 'lucide-react';
import { HotspotItem } from './RealEstate3DViewer';

interface HotspotEditorProps {
  hotspots: HotspotItem[];
  currentCameraPos?: [number, number, number];
  onChangeHotspots: (hotspots: HotspotItem[]) => void;
}

export const HotspotEditor: React.FC<HotspotEditorProps> = ({
  hotspots,
  currentCameraPos = [0, 1, 2],
  onChangeHotspots,
}) => {
  const addHotspot = () => {
    const newHotspot: HotspotItem = {
      id: `hs-${Date.now()}`,
      type: 'info',
      label: `Architectural Point ${hotspots.length + 1}`,
      title: `Architectural Point ${hotspots.length + 1}`,
      description: 'Luxury architectural finish with bespoke craftsmanship.',
      specs: 'Material: Imported Travertine Marble',
      position: [
        Number(currentCameraPos[0].toFixed(2)),
        Number(currentCameraPos[1].toFixed(2)),
        Number(currentCameraPos[2].toFixed(2)),
      ],
    };
    onChangeHotspots([...hotspots, newHotspot]);
  };

  const removeHotspot = (index: number) => {
    onChangeHotspots(hotspots.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-slate-300 font-semibold">Interactive 3D Hotspots ({hotspots.length})</span>
        <button
          onClick={addHotspot}
          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all text-[11px] font-bold"
        >
          <Plus className="w-3 h-3" />
          <span>Add Hotspot</span>
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[420px]">
        {hotspots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 italic">
            <MapPin className="w-7 h-7 mx-auto mb-2 text-slate-600 opacity-60" />
            <p>No hotspots placed yet.</p>
            <p className="text-[10px] text-slate-600">Click &quot;Add Hotspot&quot; to place markers in 3D space.</p>
          </div>
        ) : (
          hotspots.map((hs, idx) => (
            <div key={hs.id} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={hs.label || hs.title || ''}
                  onChange={(e) => {
                    const updated = [...hotspots];
                    updated[idx].label = e.target.value;
                    updated[idx].title = e.target.value;
                    onChangeHotspots(updated);
                  }}
                  placeholder="Hotspot Title"
                  className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-2/3"
                />
                <button
                  onClick={() => removeHotspot(idx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">Hotspot Category</label>
                <select
                  value={hs.type || 'info'}
                  onChange={(e) => {
                    const updated = [...hotspots];
                    updated[idx].type = e.target.value;
                    onChangeHotspots(updated);
                  }}
                  className="w-full bg-[#101522] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                >
                  <option value="info">Architectural Information</option>
                  <option value="amenity">Estate Amenity</option>
                  <option value="unit">Property Unit Anchor</option>
                  <option value="camera_jump">Camera Jump Viewpoint</option>
                  <option value="inquiry_cta">VIP Viewing Booking CTA</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-400 block mb-0.5">Description</label>
                <textarea
                  value={hs.description || hs.content || ''}
                  rows={2}
                  onChange={(e) => {
                    const updated = [...hotspots];
                    updated[idx].description = e.target.value;
                    updated[idx].content = e.target.value;
                    onChangeHotspots(updated);
                  }}
                  placeholder="Feature narrative..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-200 text-[10px] resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                <div>
                  <label className="text-[8px] text-slate-400 block font-sans">X</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hs.position[0]}
                    onChange={(e) => {
                      const updated = [...hotspots];
                      updated[idx].position[0] = parseFloat(e.target.value) || 0;
                      onChangeHotspots(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 block font-sans">Y</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hs.position[1]}
                    onChange={(e) => {
                      const updated = [...hotspots];
                      updated[idx].position[1] = parseFloat(e.target.value) || 0;
                      onChangeHotspots(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-slate-400 block font-sans">Z</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hs.position[2]}
                    onChange={(e) => {
                      const updated = [...hotspots];
                      updated[idx].position[2] = parseFloat(e.target.value) || 0;
                      onChangeHotspots(updated);
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-white"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
