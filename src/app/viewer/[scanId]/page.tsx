'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ThreeSpatialViewer from '@/components/scanning/ThreeSpatialViewer';
import { Box, Layers, Share2, Info, CheckCircle } from 'lucide-react';

export default function StandaloneViewerPage() {
  const params = useParams();
  const scanId = params?.scanId as string;

  const [scan, setScan] = useState<any | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!scanId) return;

    const fetchScanData = async () => {
      try {
        const res = await fetch(`/api/scans/${scanId}`);
        const json = await res.json();
        if (json.success) {
          setScan(json.data.scan);
          setRooms(json.data.rooms || []);
        }
      } catch (err) {
        console.error('Failed to load viewer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchScanData();
  }, [scanId]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading 3D Spatial Walkthrough...
      </div>
    );
  }

  const formattedRooms = rooms.map((r) => ({
    id: r._id,
    name: r.name,
    center: { x: 0, y: 0, z: 0 },
    areaSqFt: r.dimensions?.areaSqFt,
  }));

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden flex flex-col text-white font-sans">
      {/* Top Floating Brand & Controls Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl">
          <Box className="w-5 h-5 text-blue-400" />
          <div>
            <h1 className="text-sm font-semibold">{scan?.title || '3D Virtual Walkthrough'}</h1>
            <p className="text-[11px] text-slate-400">
              Interactive Spatial Model • {rooms.length} Rooms
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 bg-slate-900/80 backdrop-blur-md hover:bg-slate-850 rounded-xl border border-slate-800 text-xs text-slate-300 font-medium transition-colors shadow-lg cursor-pointer"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-blue-400" />
              <span>Share Walkthrough</span>
            </>
          )}
        </button>
      </header>

      {/* Main Fullscreen Three.js Spatial Viewer */}
      <div className="w-full h-full">
        <ThreeSpatialViewer scanId={scanId} rooms={formattedRooms} />
      </div>
    </div>
  );
}
