'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThreeSpatialViewer from '@/components/scanning/ThreeSpatialViewer';
import { Box, Layers, Share2, Info, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function StandaloneViewerPage() {
  const params = useParams();
  const router = useRouter();
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
        <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mr-3" />
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
      {/* Top Floating Brand & Controls Bar (Z-20) */}
      <header className="absolute top-2.5 sm:top-4 left-2.5 sm:left-4 right-2.5 sm:right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-800 shadow-xl max-w-[calc(100%-55px)] sm:max-w-md">
          <button
            onClick={() => router.back()}
            className="p-1 sm:p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Box className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm font-semibold truncate text-white">{scan?.title || '3D Virtual Walkthrough'}</h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              3D Walkthrough • {rooms.length > 0 ? `${rooms.length} Rooms` : 'Architectural Spatial Model'}
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="pointer-events-auto flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-2 bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 rounded-xl border border-slate-800 text-xs text-slate-300 font-medium transition-all shadow-lg cursor-pointer shrink-0"
          title="Share Walkthrough Link"
          aria-label="Share walkthrough link"
        >
          {copied ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline sm:ml-1.5">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline sm:ml-1.5">Share</span>
            </>
          )}
        </button>
      </header>

      {/* Main Fullscreen Three.js Spatial Viewer (with topOffset='top-16 sm:top-20' to completely prevent collision with header) */}
      <div className="w-full h-full">
        <ThreeSpatialViewer
          scanId={scanId}
          rooms={formattedRooms}
          topOffset="top-16 sm:top-20"
          className="h-full !rounded-none !border-0"
        />
      </div>
    </div>
  );
}
