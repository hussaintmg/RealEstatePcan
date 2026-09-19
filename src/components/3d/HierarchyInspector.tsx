'use client';

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Box,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Info,
  Maximize2,
} from 'lucide-react';
import { HierarchyNode, GlbMetadata } from '@/lib/3d/types';

interface HierarchyInspectorProps {
  hierarchy?: HierarchyNode[];
  metadata?: GlbMetadata;
  selectedNodeName?: string | null;
  onSelectNode?: (nodeName: string) => void;
  onMapNode?: (nodeName: string, type: 'floor' | 'unit') => void;
}

const TreeNode: React.FC<{
  node: HierarchyNode;
  selectedNodeName?: string | null;
  onSelectNode?: (name: string) => void;
  onMapNode?: (name: string, type: 'floor' | 'unit') => void;
  depth?: number;
}> = ({ node, selectedNodeName, onSelectNode, onMapNode, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeName === node.name;

  return (
    <div className="select-none">
      <div
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-colors cursor-pointer group ${
          isSelected
            ? 'bg-blue-600/30 text-white border border-blue-500/40'
            : 'text-slate-300 hover:bg-white/5 hover:text-white'
        }`}
        onClick={() => onSelectNode?.(node.name)}
      >
        <div className="flex items-center space-x-1.5 overflow-hidden">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5 text-slate-400 hover:text-white"
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <span className="w-3.5" />
          )}
          <Box className={`w-3.5 h-3.5 ${typeof node.meshIndex === 'number' ? 'text-blue-400' : 'text-slate-500'}`} />
          <span className="truncate font-mono text-[11px]">{node.name}</span>
        </div>

        {/* Quick Map Actions */}
        <div className="hidden group-hover:flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMapNode?.(node.name, 'floor');
            }}
            title="Map as Floor"
            className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 hover:bg-blue-500 hover:text-white rounded text-[9px] font-bold"
          >
            +Floor
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMapNode?.(node.name, 'unit');
            }}
            title="Map as Unit"
            className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white rounded text-[9px] font-bold"
          >
            +Unit
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="space-y-0.5">
          {node.children.map((child, idx) => (
            <TreeNode
              key={`${child.name}-${idx}`}
              node={child}
              selectedNodeName={selectedNodeName}
              onSelectNode={onSelectNode}
              onMapNode={onMapNode}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyInspector: React.FC<HierarchyInspectorProps> = ({
  hierarchy = [],
  metadata,
  selectedNodeName,
  onSelectNode,
  onMapNode,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tree' | 'metrics'>('tree');

  // Compute Performance Health Badge
  const fileSizeMb = metadata?.fileSizeBytes ? (metadata.fileSizeBytes / (1024 * 1024)).toFixed(1) : '0';
  const tris = metadata?.triangleCount || 0;

  let healthStatus: 'good' | 'warning' | 'heavy' = 'good';
  let healthLabel = 'Good Optimization';
  if (parseFloat(fileSizeMb) > 60 || tris > 500000) {
    healthStatus = 'heavy';
    healthLabel = 'Heavy Model (Recommended for Desktop)';
  } else if (parseFloat(fileSizeMb) > 25 || tris > 200000) {
    healthStatus = 'warning';
    healthLabel = 'Moderate Size (Review Textures)';
  }

  return (
    <div className="flex flex-col h-full space-y-4 text-xs">
      {/* Sub Tabs */}
      <div className="flex border-b border-white/10 pb-2 gap-2">
        <button
          onClick={() => setActiveSubTab('tree')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'tree' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Scene Tree ({metadata?.nodeCount || hierarchy.length} Nodes)
        </button>
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            activeSubTab === 'metrics' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Model Health
        </button>
      </div>

      {activeSubTab === 'tree' && (
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[420px]">
          {hierarchy.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              <Box className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
              <p>No model hierarchy available.</p>
              <p className="text-[10px] text-slate-600">Upload a GLB model to inspect nodes.</p>
            </div>
          ) : (
            hierarchy.map((rootNode, idx) => (
              <TreeNode
                key={`${rootNode.name}-${idx}`}
                node={rootNode}
                selectedNodeName={selectedNodeName}
                onSelectNode={onSelectNode}
                onMapNode={onMapNode}
              />
            ))
          )}
        </div>
      )}

      {activeSubTab === 'metrics' && metadata && (
        <div className="space-y-4">
          {/* Health Banner */}
          <div
            className={`p-3 rounded-xl border flex items-center space-x-2.5 ${
              healthStatus === 'good'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : healthStatus === 'warning'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {healthStatus === 'good' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            )}
            <div>
              <span className="block font-bold">{healthLabel}</span>
              <span className="text-[10px] opacity-80">{fileSizeMb} MB Container Size</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Triangles</span>
              <span className="text-white font-bold font-mono">{tris.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Total Nodes</span>
              <span className="text-white font-bold font-mono">{metadata.nodeCount}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Meshes / Primitives</span>
              <span className="text-white font-bold font-mono">{metadata.meshCount}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Materials</span>
              <span className="text-white font-bold font-mono">{metadata.materialCount}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Textures</span>
              <span className="text-white font-bold font-mono">{metadata.textureCount}</span>
            </div>
            <div className="p-2.5 bg-white/[0.02] border border-white/10 rounded-xl space-y-0.5">
              <span className="text-slate-400 block text-[10px]">Container Size</span>
              <span className="text-white font-bold font-mono">{fileSizeMb} MB</span>
            </div>
          </div>

          {/* Spatial Dimensions */}
          <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-2">
            <span className="text-slate-300 font-semibold block text-[11px]">Estimated Dimensions (Meters)</span>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Width (X)</span>
                <span className="text-blue-400 font-bold">{metadata.dimensions?.width}m</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Height (Y)</span>
                <span className="text-emerald-400 font-bold">{metadata.dimensions?.height}m</span>
              </div>
              <div className="p-1.5 bg-white/5 rounded-lg">
                <span className="text-[9px] text-slate-400 block">Depth (Z)</span>
                <span className="text-purple-400 font-bold">{metadata.dimensions?.depth}m</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
