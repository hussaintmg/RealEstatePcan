'use client';

import React, { useState } from 'react';
import { Layers, Building, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FloorMapping, UnitMapping } from './RealEstate3DViewer';

interface MappingPanelProps {
  floorMappings: FloorMapping[];
  unitMappings: UnitMapping[];
  namedNodes?: string[];
  onChangeFloors: (floors: FloorMapping[]) => void;
  onChangeUnits: (units: UnitMapping[]) => void;
}

export const MappingPanel: React.FC<MappingPanelProps> = ({
  floorMappings,
  unitMappings,
  namedNodes = [],
  onChangeFloors,
  onChangeUnits,
}) => {
  const [activeTab, setActiveTab] = useState<'floors' | 'units'>('units');

  // Add Floor Modal / State
  const addFloor = () => {
    const newFloor: FloorMapping = {
      floorId: `fl-${Date.now()}`,
      floorLabel: `Level ${floorMappings.length + 1}`,
      nodeName: namedNodes.find((n) => n.toLowerCase().includes('floor') && !floorMappings.some((fm) => fm.nodeName === n)) || namedNodes[0] || 'Floor_01',
      levelIndex: floorMappings.length + 1,
      elevation: floorMappings.length * 4,
    };
    onChangeFloors([...floorMappings, newFloor]);
  };

  const removeFloor = (index: number) => {
    onChangeFloors(floorMappings.filter((_, i) => i !== index));
  };

  // Add Unit
  const addUnit = () => {
    const newUnit: UnitMapping = {
      propertyUnitId: `unit-${Date.now()}`,
      unitName: `Residence ${unitMappings.length + 101}`,
      nodeName: namedNodes.find((n) => n.toLowerCase().includes('unit') && !unitMappings.some((um) => um.nodeName === n)) || namedNodes[0] || 'Unit_A101',
      price: 1500000,
      status: 'available',
      bedrooms: 3,
      bathrooms: 3,
      areaSqFt: 2200,
    };
    onChangeUnits([...unitMappings, newUnit]);
  };

  const removeUnit = (index: number) => {
    onChangeUnits(unitMappings.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-xs">
      {/* Tab Switcher */}
      <div className="flex border-b border-white/10 pb-2 gap-2">
        <button
          onClick={() => setActiveTab('units')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'units' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Units ({unitMappings.length})
        </button>
        <button
          onClick={() => setActiveTab('floors')}
          className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
            activeTab === 'floors' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Floors ({floorMappings.length})
        </button>
      </div>

      {activeTab === 'units' && (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[420px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Map 3D Nodes to Inventory Units</span>
            <button
              onClick={addUnit}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg transition-all text-[11px] font-bold"
            >
              <Plus className="w-3 h-3" />
              <span>Add Unit Map</span>
            </button>
          </div>

          {unitMappings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              <Building className="w-7 h-7 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No 3D units mapped yet.</p>
              <p className="text-[10px] text-slate-600">Click &quot;Add Unit Map&quot; to bind nodes to CRM inventory.</p>
            </div>
          ) : (
            unitMappings.map((unit, idx) => (
              <div key={unit.id || idx} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={unit.unitName || unit.name || ''}
                    onChange={(e) => {
                      const updated = [...unitMappings];
                      updated[idx].unitName = e.target.value;
                      onChangeUnits(updated);
                    }}
                    placeholder="Unit Name (e.g. Residence A-101)"
                    className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-2/3"
                  />
                  <button
                    onClick={() => removeUnit(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">3D Model Node</label>
                    <select
                      value={unit.nodeName}
                      onChange={(e) => {
                        const updated = [...unitMappings];
                        updated[idx].nodeName = e.target.value;
                        onChangeUnits(updated);
                      }}
                      className="w-full bg-[#101522] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-mono"
                    >
                      {namedNodes.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Availability Status</label>
                    <select
                      value={unit.status || 'available'}
                      onChange={(e) => {
                        const updated = [...unitMappings];
                        updated[idx].status = e.target.value;
                        onChangeUnits(updated);
                      }}
                      className="w-full bg-[#101522] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                    >
                      <option value="available">Available</option>
                      <option value="reserved">Reserved</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block">Price ($)</label>
                    <input
                      type="number"
                      value={unit.price || 0}
                      onChange={(e) => {
                        const updated = [...unitMappings];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        onChangeUnits(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Bedrooms</label>
                    <input
                      type="number"
                      value={unit.bedrooms || 2}
                      onChange={(e) => {
                        const updated = [...unitMappings];
                        updated[idx].bedrooms = parseInt(e.target.value, 10) || 1;
                        onChangeUnits(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block">Area (Sq Ft)</label>
                    <input
                      type="number"
                      value={unit.areaSqFt || 1200}
                      onChange={(e) => {
                        const updated = [...unitMappings];
                        updated[idx].areaSqFt = parseInt(e.target.value, 10) || 100;
                        onChangeUnits(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'floors' && (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[420px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Map 3D Nodes to Building Floors</span>
            <button
              onClick={addFloor}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all text-[11px] font-bold"
            >
              <Plus className="w-3 h-3" />
              <span>Add Floor Map</span>
            </button>
          </div>

          {floorMappings.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              <Layers className="w-7 h-7 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No floor mappings defined.</p>
              <p className="text-[10px] text-slate-600">Map nodes to enable floor slicing in 3D.</p>
            </div>
          ) : (
            floorMappings.map((floor, idx) => (
              <div key={floor.id || idx} className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={floor.floorLabel || floor.label || ''}
                    onChange={(e) => {
                      const updated = [...floorMappings];
                      updated[idx].floorLabel = e.target.value;
                      onChangeFloors(updated);
                    }}
                    placeholder="Floor Label (e.g. Level 1 Ground)"
                    className="bg-transparent font-bold text-white border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-2/3"
                  />
                  <button
                    onClick={() => removeFloor(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">3D Model Node</label>
                    <select
                      value={floor.nodeName}
                      onChange={(e) => {
                        const updated = [...floorMappings];
                        updated[idx].nodeName = e.target.value;
                        onChangeFloors(updated);
                      }}
                      className="w-full bg-[#101522] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] font-mono"
                    >
                      {namedNodes.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Level Index</label>
                    <input
                      type="number"
                      value={floor.levelIndex || 0}
                      onChange={(e) => {
                        const updated = [...floorMappings];
                        updated[idx].levelIndex = parseInt(e.target.value, 10) || 0;
                        onChangeFloors(updated);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-[10px]"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
