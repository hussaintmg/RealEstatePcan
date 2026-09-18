'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import * as pc from 'playcanvas';
import {
  Sun,
  Moon,
  Maximize2,
  Compass,
  RotateCcw,
  Home,
  Bed,
  Coffee,
  Play,
  Pause,
  Layers,
  Palette,
  Info,
  X,
  Check,
  Building,
  Key,
  ArrowRight,
  ShieldCheck,
  Bath,
} from 'lucide-react';

interface WorldHotspot {
  id: string;
  title: string;
  description: string;
  worldPos: pc.Vec3;
  specs: string;
}

interface MaterialPreset {
  id: string;
  name: string;
  diffuse: pc.Color;
  previewColor: string;
  type: 'floor' | 'wall';
}

export interface Unit3D {
  id: string;
  name: string;
  floor: string;
  bedrooms: number;
  bathrooms: number;
  area: string;
  status: 'Available' | 'Reserved' | 'Sold';
  price: string;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
  slug: string;
}

export const UNITS_3D: Unit3D[] = [
  {
    id: 'unit-a1204',
    name: 'Residence A-1204',
    floor: '12th Floor (Penthouse Level)',
    bedrooms: 4,
    bathrooms: 4.5,
    area: '3,850 sq ft',
    status: 'Available',
    price: '$6,450,000',
    cameraPos: [0, 8, 9],
    lookAt: [0, 2, 0],
    slug: 'the-sky-penthouse',
  },
  {
    id: 'unit-b802',
    name: 'Residence B-802',
    floor: '8th Floor (Upper Executive)',
    bedrooms: 3,
    bathrooms: 3.5,
    area: '2,600 sq ft',
    status: 'Available',
    price: '$3,850,000',
    cameraPos: [-3, 4.5, 4],
    lookAt: [0, 2, 0],
    slug: 'the-azure-residence',
  },
  {
    id: 'unit-c401',
    name: 'Residence C-401',
    floor: '4th Floor (Garden Level)',
    bedrooms: 2,
    bathrooms: 2,
    area: '1,750 sq ft',
    status: 'Reserved',
    price: '$2,150,000',
    cameraPos: [3.5, 2.5, 3],
    lookAt: [0, 1, 0],
    slug: 'lumina-terrace-suite',
  },
];

const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: 'marble', name: 'Italian Carrara Marble', diffuse: new pc.Color(0.88, 0.9, 0.92), previewColor: '#e2e8f0', type: 'floor' },
  { id: 'walnut', name: 'Dark Walnut Parquet', diffuse: new pc.Color(0.28, 0.16, 0.08), previewColor: '#451a03', type: 'floor' },
  { id: 'concrete', name: 'Polished Architectural Slate', diffuse: new pc.Color(0.2, 0.22, 0.25), previewColor: '#334155', type: 'floor' },
  { id: 'pearl', name: 'Alpine Pearl White', diffuse: new pc.Color(0.95, 0.95, 0.97), previewColor: '#f8fafc', type: 'wall' },
  { id: 'obsidian', name: 'Obsidian Accent Stone', diffuse: new pc.Color(0.12, 0.14, 0.18), previewColor: '#0f172a', type: 'wall' },
];

const TOUR_WAYPOINTS = [
  { name: 'Grand Foyer', pos: [0, 3, 7], look: [0, 1, 0] },
  { name: 'Living Room', pos: [0, 2.2, 3], look: [0, 1, -2] },
  { name: 'Chef Kitchen', pos: [4, 2.2, 1], look: [1, 1, 0] },
  { name: 'Master Suite', pos: [-4, 2.5, -1], look: [-1, 1.5, -3] },
  { name: 'Sunset Terrace', pos: [0, 5, 8], look: [0, 1, 0] },
];

interface PlayCanvasViewerProps {
  modelUrl?: string;
  title?: string;
  className?: string;
}

export const PlayCanvasViewer: React.FC<PlayCanvasViewerProps> = ({
  modelUrl,
  title = 'Interactive 3D Virtual Walkthrough',
  className = 'h-[580px] w-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<pc.Application | null>(null);
  const cameraRef = useRef<pc.Entity | null>(null);
  const lightRef = useRef<pc.Entity | null>(null);
  const floorEntityRef = useRef<pc.Entity | null>(null);
  const wallEntityRef = useRef<pc.Entity | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFloorLevel, setActiveFloorLevel] = useState<'ground' | 'upper' | 'penthouse'>('ground');
  const [selectedUnit, setSelectedUnit] = useState<Unit3D | null>(null);
  const [activeTab, setActiveTab] = useState<'floors' | 'units'>('floors');

  // Auto-Tour Camera Dolly
  const [isTouring, setIsTouring] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const tourIntervalRef = useRef<any>(null);

  // Material Customizer Drawer
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeFloorMat, setActiveFloorMat] = useState('concrete');
  const [activeWallMat, setActiveWallMat] = useState('pearl');

  // 3D Projected Screen Hotspots
  const [screenHotspots, setScreenHotspots] = useState<Array<{ id: string; title: string; desc: string; specs: string; x: number; y: number; visible: boolean }>>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<any>(null);

  const worldHotspotsRef = useRef<WorldHotspot[]>([
    {
      id: 'h1',
      title: 'Italian Carrara Marble',
      description: 'Imported vein-matched 1200x600mm honed slabs with radiant floor heating.',
      specs: 'Thickness: 20mm • Acoustic Underlay: 5mm',
      worldPos: new pc.Vec3(0, 0.2, 0),
    },
    {
      id: 'h2',
      title: 'Floor-to-Ceiling Thermal Glass',
      description: 'Triple-glazed low-E acoustic glazing with structural frameless mullions.',
      specs: 'U-Value: 0.8 W/m²K • Acoustic: 46dB STC',
      worldPos: new pc.Vec3(0, 2.5, -4.8),
    },
    {
      id: 'h3',
      title: 'Minimalist Chef Island',
      description: 'Seamless waterfall quartz with integrated induction and brass fittings.',
      specs: 'Material: Caesarstone Quartz • Hardware: Blum Soft-close',
      worldPos: new pc.Vec3(2.5, 0.8, -0.5),
    },
  ]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      graphicsDeviceOptions: { alpha: true, antialias: true },
    });

    appRef.current = app;
    app.start();
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // Create Main Camera
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.04, 0.06, 0.1, 1),
      fov: 55,
      nearClip: 0.1,
      farClip: 1000,
    });
    camera.setPosition(0, 3, 7);
    camera.lookAt(0, 1, 0);
    app.root.addChild(camera);
    cameraRef.current = camera;

    // Directional Sunlight
    const light = new pc.Entity('MainSun');
    light.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.95, 0.88),
      intensity: 1.6,
      castShadows: true,
      shadowDistance: 35,
      shadowResolution: 2048,
    });
    light.setEulerAngles(45, 35, 0);
    app.root.addChild(light);
    lightRef.current = light;

    // Ambient Fill & Ceiling Downlights
    const fillLight = new pc.Entity('FillLight');
    fillLight.addComponent('light', {
      type: 'omni',
      color: new pc.Color(0.5, 0.65, 0.95),
      intensity: 0.7,
      range: 30,
    });
    fillLight.setPosition(0, 5, 2);
    app.root.addChild(fillLight);

    // Load GLB Container Asset or Fallback to Procedural Villa
    if (modelUrl && (modelUrl.endsWith('.glb') || modelUrl.endsWith('.gltf') || modelUrl.includes('/models/') || modelUrl.includes('supabase') || modelUrl.startsWith('http'))) {
      app.assets.loadFromUrl(modelUrl, 'container', (err, asset) => {
        if (!err && asset?.resource) {
          try {
            const modelEntity = (asset.resource as any).instantiateRenderEntity();
            modelEntity.name = 'ImportedArchitecturalModel';
            app.root.addChild(modelEntity);
            setLoading(false);
          } catch (instantiateErr) {
            console.warn('Failed to instantiate GLB entity, falling back to villa:', instantiateErr);
            createLuxuryVilla(app);
            setLoading(false);
          }
        } else {
          console.warn('Could not load 3D container, falling back to luxury villa:', err);
          createLuxuryVilla(app);
          setLoading(false);
        }
      });
    } else {
      createLuxuryVilla(app);
      setLoading(false);
    }

    // Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitX = 0;
    let orbitY = 20;
    let distance = 8;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitX -= deltaX * 0.3;
      orbitY = Math.max(-5, Math.min(75, orbitY + deltaY * 0.3));

      updateCameraPosition(orbitX, orbitY, distance);
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(3, Math.min(18, distance + e.deltaY * 0.005));
      updateCameraPosition(orbitX, orbitY, distance);
    };

    function updateCameraPosition(rotX: number, rotY: number, dist: number) {
      if (!cameraRef.current) return;
      const radX = (rotX * Math.PI) / 180;
      const radY = (rotY * Math.PI) / 180;

      const posX = dist * Math.cos(radY) * Math.sin(radX);
      const posY = dist * Math.sin(radY) + 1;
      const posZ = dist * Math.cos(radY) * Math.cos(radX);

      cameraRef.current.setPosition(posX, posY, posZ);
      cameraRef.current.lookAt(0, 1, 0);
    }

    // Touch Controls (Mobile Touch Orbit & Pinch Zoom)
    let touchStartX = 0;
    let touchStartY = 0;
    let initialPinchDist = 0;
    let isTouching = false;

    const getTouchDist = (e: TouchEvent) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isTouching = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        initialPinchDist = getTouchDist(e);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouching) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;

        orbitX -= deltaX * 0.4;
        orbitY = Math.max(-5, Math.min(75, orbitY + deltaY * 0.4));
        updateCameraPosition(orbitX, orbitY, distance);
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        const currentDist = getTouchDist(e);
        const pinchDelta = initialPinchDist - currentDist;
        initialPinchDist = currentDist;

        distance = Math.max(3, Math.min(18, distance + pinchDelta * 0.02));
        updateCameraPosition(orbitX, orbitY, distance);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isTouching = false;
        initialPinchDist = 0;
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // Update 3D projected screen hotspots on each render tick
    const screenCoord = new pc.Vec3();
    const updateHotspotsTick = () => {
      if (!cameraRef.current?.camera || !canvasRef.current) return;
      const cam = cameraRef.current.camera;
      const rect = canvasRef.current.getBoundingClientRect();

      const projected = worldHotspotsRef.current.map((h) => {
        cam.worldToScreen(h.worldPos, screenCoord);
        // Only visible if in front of camera
        const forward = cameraRef.current!.forward;
        const dirToPoint = new pc.Vec3().sub2(h.worldPos, cameraRef.current!.getPosition());
        const isFacing = forward.dot(dirToPoint) > 0;

        return {
          id: h.id,
          title: h.title,
          desc: h.description,
          specs: h.specs,
          x: (screenCoord.x / canvasRef.current!.width) * rect.width,
          y: (screenCoord.y / canvasRef.current!.height) * rect.height,
          visible: isFacing && screenCoord.x >= 0 && screenCoord.x <= canvasRef.current!.width && screenCoord.y >= 0 && screenCoord.y <= canvasRef.current!.height,
        };
      });

      setScreenHotspots(projected);
    };

    app.on('update', updateHotspotsTick);

    const handleResize = () => app.resizeCanvas();
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      app.off('update', updateHotspotsTick);
      app.destroy();
    };
  }, [modelUrl]);

  // Luxury Architectural Villa Geometry & Materials
  const createLuxuryVilla = (app: pc.Application) => {
    // 1. Foundation Slab Floor
    const floor = new pc.Entity('MainFloor');
    floor.addComponent('render', { type: 'box' });
    floor.setLocalScale(14, 0.25, 12);
    floor.setPosition(0, -0.125, 0);

    const floorMat = new pc.StandardMaterial();
    floorMat.diffuse = new pc.Color(0.2, 0.22, 0.25);
    floorMat.update();
    if ((floor.render as any)?.meshInstances?.[0]) (floor.render as any).meshInstances[0].material = floorMat;
    app.root.addChild(floor);
    floorEntityRef.current = floor;

    // 2. Feature Walls
    const backWall = new pc.Entity('BackWall');
    backWall.addComponent('render', { type: 'box' });
    backWall.setLocalScale(14, 4.5, 0.3);
    backWall.setPosition(0, 2.25, -6);

    const wallMat = new pc.StandardMaterial();
    wallMat.diffuse = new pc.Color(0.95, 0.95, 0.97);
    wallMat.update();
    if ((backWall.render as any)?.meshInstances?.[0]) (backWall.render as any).meshInstances[0].material = wallMat;
    app.root.addChild(backWall);
    wallEntityRef.current = backWall;

    // 3. Floating Architectural Cantilever Roof
    const roof = new pc.Entity('CantileverRoof');
    roof.addComponent('render', { type: 'box' });
    roof.setLocalScale(15, 0.2, 13);
    roof.setPosition(0, 4.5, 0.5);
    const roofMat = new pc.StandardMaterial();
    roofMat.diffuse = new pc.Color(0.12, 0.14, 0.18);
    roofMat.update();
    if ((roof.render as any)?.meshInstances?.[0]) (roof.render as any).meshInstances[0].material = roofMat;
    app.root.addChild(roof);

    // 4. Modern Italian Sofa Setup
    const sofa = new pc.Entity('DesignerSofa');
    sofa.addComponent('render', { type: 'box' });
    sofa.setLocalScale(4, 0.75, 1.6);
    sofa.setPosition(-1, 0.38, 1);
    const sofaMat = new pc.StandardMaterial();
    sofaMat.diffuse = new pc.Color(0.18, 0.32, 0.55);
    sofaMat.update();
    if ((sofa.render as any)?.meshInstances?.[0]) (sofa.render as any).meshInstances[0].material = sofaMat;
    app.root.addChild(sofa);

    // 5. Minimalist Quartz Kitchen Island
    const island = new pc.Entity('KitchenIsland');
    island.addComponent('render', { type: 'box' });
    island.setLocalScale(3.2, 1, 1.2);
    island.setPosition(3.5, 0.5, -2);
    const islandMat = new pc.StandardMaterial();
    islandMat.diffuse = new pc.Color(0.9, 0.9, 0.92);
    islandMat.update();
    if ((island.render as any)?.meshInstances?.[0]) (island.render as any).meshInstances[0].material = islandMat;
    app.root.addChild(island);
  };

  // Smooth Camera Lerp Helper
  const lerpCameraTo = (endPos: [number, number, number], lookAt: [number, number, number], onComplete?: () => void) => {
    if (!cameraRef.current) return;
    const start = cameraRef.current.getPosition();
    const end = new pc.Vec3(...endPos);
    const target = new pc.Vec3(...lookAt);

    let t = 0;
    const interval = setInterval(() => {
      t += 0.04;
      if (t >= 1 || !cameraRef.current) {
        cameraRef.current?.setPosition(end);
        cameraRef.current?.lookAt(target);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        const cur = new pc.Vec3().lerp(start, end, t);
        cameraRef.current?.setPosition(cur);
        cameraRef.current?.lookAt(target);
      }
    }, 16);
  };

  // Cinematic Auto-Tour Handler
  const toggleAutoTour = () => {
    if (isTouring) {
      clearInterval(tourIntervalRef.current);
      setIsTouring(false);
    } else {
      setIsTouring(true);
      startTourStep(0);
    }
  };

  const startTourStep = (index: number) => {
    const wp = TOUR_WAYPOINTS[index % TOUR_WAYPOINTS.length];
    setTourIndex(index % TOUR_WAYPOINTS.length);

    lerpCameraTo(wp.pos as any, wp.look as any, () => {
      tourIntervalRef.current = setTimeout(() => {
        startTourStep(index + 1);
      }, 3500);
    });
  };

  // Switch Material
  const applyMaterial = (preset: MaterialPreset) => {
    if (preset.type === 'floor' && floorEntityRef.current) {
      const mat = new pc.StandardMaterial();
      mat.diffuse = preset.diffuse;
      mat.update();
      if ((floorEntityRef.current.render as any)?.meshInstances?.[0]) {
        (floorEntityRef.current.render as any).meshInstances[0].material = mat;
      }
      setActiveFloorMat(preset.id);
    } else if (preset.type === 'wall' && wallEntityRef.current) {
      const mat = new pc.StandardMaterial();
      mat.diffuse = preset.diffuse;
      mat.update();
      if ((wallEntityRef.current.render as any)?.meshInstances?.[0]) {
        (wallEntityRef.current.render as any).meshInstances[0].material = mat;
      }
      setActiveWallMat(preset.id);
    }
  };

  // Switch Floor Level Slicing
  const handleFloorLevel = (level: 'ground' | 'upper' | 'penthouse') => {
    setActiveFloorLevel(level);
    if (level === 'ground') {
      lerpCameraTo([0, 3, 7], [0, 1, 0]);
    } else if (level === 'upper') {
      lerpCameraTo([-3, 4.5, 4], [0, 2, 0]);
    } else {
      lerpCameraTo([0, 9, 8], [0, 2, 0]);
    }
  };

  // Select 3D Real Estate Unit
  const handleSelectUnit = (unit: Unit3D) => {
    setSelectedUnit(unit);
    lerpCameraTo(unit.cameraPos, unit.lookAt);
  };

  // Day / Night Ambiance Toggle
  const toggleDayNight = () => {
    setIsNightMode(!isNightMode);
    if (!lightRef.current?.light || !cameraRef.current?.camera) return;

    if (!isNightMode) {
      // Twilight Night
      lightRef.current.light.color = new pc.Color(0.25, 0.35, 0.7);
      lightRef.current.light.intensity = 0.45;
      cameraRef.current.camera.clearColor = new pc.Color(0.015, 0.02, 0.06, 1);
    } else {
      // Golden Hour Day
      lightRef.current.light.color = new pc.Color(1, 0.95, 0.88);
      lightRef.current.light.intensity = 1.6;
      cameraRef.current.camera.clearColor = new pc.Color(0.04, 0.06, 0.1, 1);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#070a0f] shadow-2xl ${className} select-none`}
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing touch-none" />

      {/* 3D Floating World Hotspots */}
      {screenHotspots.map(
        (spot) =>
          spot.visible && (
            <div
              key={spot.id}
              style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 transition-transform hover:scale-110"
            >
              <button
                onClick={() => setSelectedHotspot(spot)}
                className="relative group p-2 bg-blue-600/80 hover:bg-blue-500 rounded-full border border-white/40 shadow-lg shadow-blue-600/40 backdrop-blur-md transition-all animate-pulse"
              >
                <Info className="w-3.5 h-3.5 text-white" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
                  {spot.title}
                </span>
              </button>
            </div>
          )
      )}

      {/* Selected Hotspot Detail Card */}
      {selectedHotspot && (
        <div className="absolute top-16 left-6 max-w-xs bg-[#101522]/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-20 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{selectedHotspot.title}</span>
            <button onClick={() => setSelectedHotspot(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300">{selectedHotspot.desc}</p>
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 font-mono">
            {selectedHotspot.specs}
          </div>
        </div>
      )}

      {/* Selected Unit 3D Luxury Real Estate Information Panel */}
      {selectedUnit && (
        <div className="absolute top-16 left-6 max-w-sm w-full bg-[#0d121f]/95 backdrop-blur-2xl border border-white/20 p-5 rounded-2xl shadow-2xl z-30 space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedUnit.status === 'Available'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : selectedUnit.status === 'Reserved'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {selectedUnit.status}
                </span>
                <span className="text-xs text-slate-400 font-medium">{selectedUnit.floor}</span>
              </div>
              <h4 className="text-lg font-bold text-white mt-1">{selectedUnit.name}</h4>
            </div>
            <button
              onClick={() => setSelectedUnit(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10">
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Bed className="w-3.5 h-3.5" />
                <span>Beds</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{selectedUnit.bedrooms}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Bath className="w-3.5 h-3.5" />
                <span>Baths</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{selectedUnit.bathrooms}</p>
            </div>
            <div className="text-center p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Building className="w-3.5 h-3.5" />
                <span>Area</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{selectedUnit.area}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Estimated Pricing</p>
              <p className="text-lg font-extrabold text-blue-400">{selectedUnit.price}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={`/properties/${selectedUnit.slug}`}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>View Property</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/contact"
                className="px-3 py-2 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold border border-white/20 transition-all"
              >
                Enquire
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Title & Engine Badge */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg">
        <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
        <span className="text-xs font-semibold text-white tracking-wide">{title}</span>
      </div>

      {/* Top Right Controls Toolbar */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg">
        {/* Cinematic Auto-Tour Toggle */}
        <button
          onClick={toggleAutoTour}
          title={isTouring ? 'Pause Cinematic Tour' : 'Start Cinematic Walkthrough'}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isTouring ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 animate-pulse' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isTouring ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isTouring ? `Touring (${TOUR_WAYPOINTS[tourIndex].name})` : 'Cinematic Tour'}</span>
        </button>

        {/* Material Customizer Trigger */}
        <button
          onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          title="Customize Interior Materials"
          className={`p-2 rounded-lg transition-colors ${
            isPaletteOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Day / Night Toggle */}
        <button
          onClick={toggleDayNight}
          title={isNightMode ? 'Switch to Golden Hour Day' : 'Switch to Twilight Night'}
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {isNightMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Reset Camera */}
        <button
          onClick={() => lerpCameraTo([0, 3, 7], [0, 1, 0])}
          title="Reset Camera View"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen"
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Material Customizer Drawer */}
      {isPaletteOpen && (
        <div className="absolute top-16 right-4 w-72 bg-[#101522]/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Palette className="w-3.5 h-3.5 text-blue-400" />
              <span>Material Finishes</span>
            </span>
            <button onClick={() => setIsPaletteOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Flooring Material Options */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Flooring Surfaces
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {MATERIAL_PRESETS.filter((m) => m.type === 'floor').map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyMaterial(preset)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                    activeFloorMat === preset.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      style={{ backgroundColor: preset.previewColor }}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    />
                    <span>{preset.name}</span>
                  </div>
                  {activeFloorMat === preset.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Wall Paint Options */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Wall & Accent Finishes
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {MATERIAL_PRESETS.filter((m) => m.type === 'wall').map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyMaterial(preset)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs border transition-all ${
                    activeWallMat === preset.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      style={{ backgroundColor: preset.previewColor }}
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                    />
                    <span>{preset.name}</span>
                  </div>
                  {activeWallMat === preset.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Switcher Bar (Floors vs Units) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl max-w-[95vw] overflow-x-auto">
        <div className="flex items-center bg-white/10 rounded-xl p-0.5 mr-1">
          <button
            onClick={() => setActiveTab('floors')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'floors' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Floors
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'units' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Units
          </button>
        </div>

        {activeTab === 'floors' ? (
          <div className="flex items-center space-x-1">
            {[
              { id: 'ground', label: 'Ground Floor', icon: Home },
              { id: 'upper', label: 'Master Suites', icon: Bed },
              { id: 'penthouse', label: 'Rooftop Pavilion', icon: Coffee },
            ].map((lvl) => {
              const Icon = lvl.icon;
              const isActive = activeFloorLevel === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => handleFloorLevel(lvl.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lvl.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            {UNITS_3D.map((unit) => {
              const isSelected = selectedUnit?.id === unit.id;
              return (
                <button
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{unit.name}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      unit.status === 'Available'
                        ? 'bg-emerald-400'
                        : unit.status === 'Reserved'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0d14]/80 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-medium">Initializing PlayCanvas 3D WebGL Engine...</p>
          </div>
        </div>
      )}
    </div>
  );
};
