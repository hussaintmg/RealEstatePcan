'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import * as pc from 'playcanvas';
import {
  Compass,
  RotateCcw,
  Maximize2,
  Minimize2,
  Layers,
  Info,
  X,
  Bed,
  Bath,
  Building,
  ArrowRight,
  Sun,
  Moon,
  Camera,
  Play,
  Pause,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export interface HotspotItem {
  id: string;
  type?: string;
  title?: string;
  label?: string;
  description?: string;
  content?: string;
  specs?: string;
  position: [number, number, number];
  targetLookAt?: [number, number, number];
  targetEntityId?: string;
}

export interface CameraBookmark {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  order?: number;
}

export interface FloorMapping {
  id?: string;
  floorId?: string;
  label?: string;
  floorLabel?: string;
  nodeName: string;
  levelIndex?: number;
  elevation?: number;
}

export interface UnitMapping {
  id?: string;
  propertyUnitId?: string;
  unitName?: string;
  name?: string;
  nodeName: string;
  price?: number;
  status?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  cameraBookmarkId?: string;
  cameraPos?: [number, number, number];
  lookAt?: [number, number, number];
}

export interface RealEstate3DViewerProps {
  modelUrl?: string;
  previewImageUrl?: string;
  title?: string;
  cameraSettings?: {
    defaultPosition?: [number, number, number];
    defaultTarget?: [number, number, number];
    fov?: number;
    minDistance?: number;
    maxDistance?: number;
    minPitch?: number;
    maxPitch?: number;
  };
  sceneSettings?: {
    rootTransform?: {
      position?: [number, number, number];
      rotation?: [number, number, number];
      scale?: [number, number, number];
    };
    environmentPreset?: 'golden_hour' | 'twilight_night' | 'studio_bright' | 'sunset' | 'dark_presentation';
    exposure?: number;
    ambientIntensity?: number;
    shadowQuality?: 'off' | 'low' | 'medium' | 'high';
  };
  bookmarks?: CameraBookmark[];
  floorMappings?: FloorMapping[];
  unitMappings?: UnitMapping[];
  hotspots?: HotspotItem[];
  mode?: 'editor' | 'preview' | 'public';
  selectedNodeName?: string | null;
  onSelectNode?: (nodeName: string | null, nodeData?: any) => void;
  onCameraChange?: (cam: { position: [number, number, number]; target: [number, number, number]; fov: number }) => void;
  onInquireUnit?: (unit: UnitMapping) => void;
  className?: string;
}

export const RealEstate3DViewer: React.FC<RealEstate3DViewerProps> = ({
  modelUrl,
  previewImageUrl,
  title = 'Interactive 3D Virtual Walkthrough',
  cameraSettings,
  sceneSettings,
  bookmarks = [],
  floorMappings = [],
  unitMappings = [],
  hotspots = [],
  mode = 'public',
  selectedNodeName = null,
  onSelectNode,
  onCameraChange,
  onInquireUnit,
  className = 'h-[580px] w-full',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<pc.Application | null>(null);
  const cameraRef = useRef<pc.Entity | null>(null);
  const sunLightRef = useRef<pc.Entity | null>(null);
  const rootModelEntityRef = useRef<pc.Entity | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);

  // Active Floor Isolation
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);

  // Selected Unit & Hotspot Overlays
  const [activeUnit, setActiveUnit] = useState<UnitMapping | null>(null);
  const [activeHotspot, setActiveHotspot] = useState<HotspotItem | null>(null);

  // Projected Screen Hotspots
  const [screenHotspots, setScreenHotspots] = useState<
    Array<{
      id: string;
      item: HotspotItem;
      x: number;
      y: number;
      visible: boolean;
    }>
  >([]);

  // Camera Target
  const currentTargetRef = useRef<pc.Vec3>(
    new pc.Vec3(
      cameraSettings?.defaultTarget?.[0] || 0,
      cameraSettings?.defaultTarget?.[1] || 1,
      cameraSettings?.defaultTarget?.[2] || 0
    )
  );

  // Default camera coords
  const defaultPos = cameraSettings?.defaultPosition || [0, 3, 7];
  const defaultTarget = cameraSettings?.defaultTarget || [0, 1, 0];

  // Smooth Camera Lerp
  const lerpCamera = useCallback(
    (endPos: [number, number, number], endTarget: [number, number, number], endFov = 55, onComplete?: () => void) => {
      if (!cameraRef.current) return;
      const startPos = cameraRef.current.getPosition().clone();
      const startTarget = currentTargetRef.current.clone();
      const targetPosVec = new pc.Vec3(...endPos);
      const targetVec = new pc.Vec3(...endTarget);

      let progress = 0;
      const step = 0.05;

      const timer = setInterval(() => {
        progress += step;
        if (progress >= 1 || !cameraRef.current) {
          clearInterval(timer);
          cameraRef.current?.setPosition(targetPosVec);
          cameraRef.current?.lookAt(targetVec);
          currentTargetRef.current = targetVec;
          if (cameraRef.current?.camera) cameraRef.current.camera.fov = endFov;
          if (onCameraChange) {
            onCameraChange({
              position: [targetPosVec.x, targetPosVec.y, targetPosVec.z],
              target: [targetVec.x, targetVec.y, targetVec.z],
              fov: endFov,
            });
          }
          if (onComplete) onComplete();
        } else {
          const curPos = new pc.Vec3().lerp(startPos, targetPosVec, progress);
          const curTarget = new pc.Vec3().lerp(startTarget, targetVec, progress);
          cameraRef.current?.setPosition(curPos);
          cameraRef.current?.lookAt(curTarget);
        }
      }, 16);
    },
    [onCameraChange]
  );

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check WebGL availability
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      setLoadError('WebGL is not supported or disabled on your current browser.');
      setLoading(false);
      return;
    }

    // Initialize PlayCanvas Application
    const app = new pc.Application(canvas, {
      mouse: new pc.Mouse(canvas),
      touch: new pc.TouchDevice(canvas),
      graphicsDeviceOptions: { alpha: true, antialias: true, preserveDrawingBuffer: true },
    });

    appRef.current = app;
    app.start();
    app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);

    // 1. Create Main Camera Entity
    const camera = new pc.Entity('MainCamera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.04, 0.06, 0.1, 1),
      fov: cameraSettings?.fov || 55,
      nearClip: 0.1,
      farClip: 1000,
    });
    camera.setPosition(defaultPos[0], defaultPos[1], defaultPos[2]);
    camera.lookAt(defaultTarget[0], defaultTarget[1], defaultTarget[2]);
    app.root.addChild(camera);
    cameraRef.current = camera;

    // 2. Directional Sun Light
    const sunLight = new pc.Entity('DirectionalSun');
    sunLight.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.96, 0.9),
      intensity: 1.5,
      castShadows: sceneSettings?.shadowQuality !== 'off',
      shadowDistance: 45,
      shadowResolution: sceneSettings?.shadowQuality === 'high' ? 2048 : 1024,
    });
    sunLight.setEulerAngles(45, 35, 0);
    app.root.addChild(sunLight);
    sunLightRef.current = sunLight;

    // 3. Ambient Downlight
    const ambientLight = new pc.Entity('AmbientFill');
    ambientLight.addComponent('light', {
      type: 'omni',
      color: new pc.Color(0.6, 0.72, 0.95),
      intensity: sceneSettings?.ambientIntensity || 0.6,
      range: 40,
    });
    ambientLight.setPosition(0, 8, 0);
    app.root.addChild(ambientLight);

    // 4. Model Loading Pipeline
    if (modelUrl && modelUrl.length > 0) {
      setLoading(true);
      app.assets.loadFromUrl(modelUrl, 'container', (err, asset) => {
        if (!err && asset?.resource) {
          try {
            const modelEntity = (asset.resource as any).instantiateRenderEntity();
            modelEntity.name = 'ArchitecturalModelRoot';

            // Apply Root Transform if specified
            if (sceneSettings?.rootTransform) {
              const pos = sceneSettings.rootTransform.position || [0, 0, 0];
              const rot = sceneSettings.rootTransform.rotation || [0, 0, 0];
              const scl = sceneSettings.rootTransform.scale || [1, 1, 1];
              modelEntity.setPosition(pos[0], pos[1], pos[2]);
              modelEntity.setEulerAngles(rot[0], rot[1], rot[2]);
              modelEntity.setLocalScale(scl[0], scl[1], scl[2]);
            }

            app.root.addChild(modelEntity);
            rootModelEntityRef.current = modelEntity;
            setLoading(false);
          } catch (instErr: any) {
            console.warn('Failed to instantiate model container:', instErr);
            buildFallbackVilla(app);
            setLoading(false);
          }
        } else {
          console.warn('Model container could not be loaded, using fallback architecture:', err);
          buildFallbackVilla(app);
          setLoading(false);
        }
      });
    } else {
      buildFallbackVilla(app);
      setLoading(false);
    }

    // 5. Interactive Orbit & Pan Controls
    let isDragging = false;
    let isPanning = false;
    let prevX = 0;
    let prevY = 0;
    let dragStartX = 0;
    let dragStartY = 0;

    let orbitX = 0;
    let orbitY = 25;
    let distance = Math.sqrt(
      Math.pow(defaultPos[0] - defaultTarget[0], 2) +
        Math.pow(defaultPos[1] - defaultTarget[1], 2) +
        Math.pow(defaultPos[2] - defaultTarget[2], 2)
    ) || 8;

    const minPitch = cameraSettings?.minPitch ?? -10;
    const maxPitch = cameraSettings?.maxPitch ?? 85;
    const minDist = cameraSettings?.minDistance ?? 1.5;
    const maxDist = cameraSettings?.maxDistance ?? 60;

    const updateCamera = () => {
      if (!cameraRef.current) return;
      const radX = (orbitX * Math.PI) / 180;
      const radY = (orbitY * Math.PI) / 180;

      const target = currentTargetRef.current;
      const posX = target.x + distance * Math.cos(radY) * Math.sin(radX);
      const posY = target.y + distance * Math.sin(radY);
      const posZ = target.z + distance * Math.cos(radY) * Math.cos(radX);

      cameraRef.current.setPosition(posX, posY, posZ);
      cameraRef.current.lookAt(target);

      if (onCameraChange) {
        onCameraChange({
          position: [posX, posY, posZ],
          target: [target.x, target.y, target.z],
          fov: cameraRef.current.camera?.fov || 55,
        });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      isPanning = e.button === 2 || e.shiftKey;
      prevX = e.clientX;
      prevY = e.clientY;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      if (isPanning) {
        // Pan Target
        const panSpeed = 0.005 * distance;
        const right = cameraRef.current.right;
        const up = cameraRef.current.up;

        currentTargetRef.current.x -= (right.x * deltaX - up.x * deltaY) * panSpeed;
        currentTargetRef.current.y -= (right.y * deltaX - up.y * deltaY) * panSpeed;
        currentTargetRef.current.z -= (right.z * deltaX - up.z * deltaY) * panSpeed;
      } else {
        // Orbit
        orbitX -= deltaX * 0.35;
        orbitY = Math.max(minPitch, Math.min(maxPitch, orbitY + deltaY * 0.35));
      }

      updateCamera();
    };

    const onMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        const moveDist = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
        if (moveDist < 4) {
          // Click event: Perform Raycast Picking for Mapped Units / Nodes
          handleCanvasClick(e.clientX, e.clientY);
        }
      }
      isDragging = false;
      isPanning = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      distance = Math.max(minDist, Math.min(maxDist, distance + e.deltaY * 0.006));
      updateCamera();
    };

    // Mobile Touch Gesture Support (1-finger orbit, 2-finger pinch zoom)
    let touchStartX = 0;
    let touchStartY = 0;
    let initPinchDist = 0;
    let isTouching = false;

    const calcPinchDist = (e: TouchEvent) => {
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
        prevX = touchStartX;
        prevY = touchStartY;
      } else if (e.touches.length === 2) {
        initPinchDist = calcPinchDist(e);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouching) {
        const deltaX = e.touches[0].clientX - prevX;
        const deltaY = e.touches[0].clientY - prevY;
        prevX = e.touches[0].clientX;
        prevY = e.touches[0].clientY;

        orbitX -= deltaX * 0.4;
        orbitY = Math.max(minPitch, Math.min(maxPitch, orbitY + deltaY * 0.4));
        updateCamera();
      } else if (e.touches.length === 2 && initPinchDist > 0) {
        const curDist = calcPinchDist(e);
        const delta = initPinchDist - curDist;
        initPinchDist = curDist;
        distance = Math.max(minDist, Math.min(maxDist, distance + delta * 0.02));
        updateCamera();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (isTouching) {
          const dist = Math.hypot(prevX - touchStartX, prevY - touchStartY);
          if (dist < 5) {
            handleCanvasClick(touchStartX, touchStartY);
          }
        }
        isTouching = false;
        initPinchDist = 0;
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    // 6. Raycast Canvas Click Handler
    const handleCanvasClick = (clientX: number, clientY: number) => {
      if (!cameraRef.current?.camera || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // In real estate mapping, check if clicked entity matches a mapped unit or node
      if (unitMappings && unitMappings.length > 0) {
        // Cycle / select first unit if clicked near center or let user pick via UI
      }
    };

    // 7. Projected Screen Hotspots Update Loop
    const screenCoord = new pc.Vec3();
    const updateHotspotsTick = () => {
      if (!cameraRef.current?.camera || !canvasRef.current) return;
      const cam = cameraRef.current.camera;
      const rect = canvasRef.current.getBoundingClientRect();
      const camPos = cameraRef.current.getPosition();
      const forward = cameraRef.current.forward;

      const projected = hotspots.map((h) => {
        const worldPos = new pc.Vec3(h.position[0], h.position[1], h.position[2]);
        cam.worldToScreen(worldPos, screenCoord);

        const dir = new pc.Vec3().sub2(worldPos, camPos);
        const inFront = forward.dot(dir) > 0;

        return {
          id: h.id,
          item: h,
          x: (screenCoord.x / canvasRef.current!.width) * rect.width,
          y: (screenCoord.y / canvasRef.current!.height) * rect.height,
          visible:
            inFront &&
            screenCoord.x >= 0 &&
            screenCoord.x <= canvasRef.current!.width &&
            screenCoord.y >= 0 &&
            screenCoord.y <= canvasRef.current!.height,
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
  }, [modelUrl, cameraSettings, sceneSettings]);

  // Procedural Architectural Villa Fallback
  const buildFallbackVilla = (app: pc.Application) => {
    const floor = new pc.Entity('MainFloor');
    floor.addComponent('render', { type: 'box' });
    floor.setLocalScale(14, 0.25, 12);
    floor.setPosition(0, -0.125, 0);
    const floorMat = new pc.StandardMaterial();
    floorMat.diffuse = new pc.Color(0.2, 0.22, 0.25);
    floorMat.update();
    if ((floor.render as any)?.meshInstances?.[0]) (floor.render as any).meshInstances[0].material = floorMat;
    app.root.addChild(floor);

    const wall = new pc.Entity('ArchitecturalWall');
    wall.addComponent('render', { type: 'box' });
    wall.setLocalScale(14, 4.5, 0.3);
    wall.setPosition(0, 2.25, -6);
    const wallMat = new pc.StandardMaterial();
    wallMat.diffuse = new pc.Color(0.95, 0.95, 0.97);
    wallMat.update();
    if ((wall.render as any)?.meshInstances?.[0]) (wall.render as any).meshInstances[0].material = wallMat;
    app.root.addChild(wall);
  };

  // Day/Night Ambiance Toggle
  const toggleDayNight = () => {
    setIsNightMode(!isNightMode);
    if (!sunLightRef.current?.light || !cameraRef.current?.camera) return;

    if (!isNightMode) {
      sunLightRef.current.light.color = new pc.Color(0.25, 0.35, 0.7);
      sunLightRef.current.light.intensity = 0.5;
      cameraRef.current.camera.clearColor = new pc.Color(0.015, 0.02, 0.06, 1);
    } else {
      sunLightRef.current.light.color = new pc.Color(1, 0.96, 0.9);
      sunLightRef.current.light.intensity = 1.5;
      cameraRef.current.camera.clearColor = new pc.Color(0.04, 0.06, 0.1, 1);
    }
  };

  // Toggle Fullscreen
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

  // Select Unit Viewpoint
  const handleSelectUnit = (unit: UnitMapping) => {
    setActiveUnit(unit);
    if (unit.cameraPos && unit.lookAt) {
      lerpCamera(unit.cameraPos, unit.lookAt);
    } else if (unit.cameraBookmarkId) {
      const bm = bookmarks.find((b) => b.id === unit.cameraBookmarkId);
      if (bm) lerpCamera(bm.position, bm.target, bm.fov);
    }
  };

  // Floor Isolation Filter
  const handleIsolateFloor = (floorName: string | null) => {
    setSelectedFloor(floorName);
    if (!rootModelEntityRef.current) return;

    // Traverse root children
    if (floorName === null) {
      // Restore all
      rootModelEntityRef.current.children.forEach((child) => {
        child.enabled = true;
      });
    } else {
      rootModelEntityRef.current.children.forEach((child) => {
        if (child.name === floorName || child.name.includes(floorName)) {
          child.enabled = true;
        } else if (floorMappings.some((fm) => fm.nodeName === child.name)) {
          child.enabled = false;
        }
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#070a0f] shadow-2xl ${className} select-none`}
    >
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing touch-none" />

      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 bg-[#070a0f]/80 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-30">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-300">Initializing 3D Spatial Walkthrough...</span>
        </div>
      )}

      {/* WebGL Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 bg-[#070a0f] flex flex-col items-center justify-center p-6 text-center space-y-3 z-40">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <h4 className="text-base font-bold text-white">3D Spatial Experience Offline</h4>
          <p className="text-xs text-slate-400 max-w-sm">{loadError}</p>
          {previewImageUrl && (
            <img
              src={previewImageUrl}
              alt="Property Preview"
              className="max-h-48 rounded-xl border border-white/10 mt-2 object-cover"
            />
          )}
        </div>
      )}

      {/* Mode Indicator Banner */}
      {mode === 'preview' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500/20 border border-amber-500/30 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-300 uppercase tracking-widest z-20 flex items-center space-x-1.5 shadow-lg">
          <Sparkles className="w-3 h-3" />
          <span>Visitor Preview Mode (Draft)</span>
        </div>
      )}

      {/* Top Left Title Badge */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg z-20">
        <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
        <span className="text-xs font-semibold text-white tracking-wide">{title}</span>
      </div>

      {/* Top Right Controls Toolbar */}
      <div className="absolute top-4 right-4 flex items-center space-x-2 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-lg z-20">
        {/* Day / Night Toggle */}
        <button
          onClick={toggleDayNight}
          title={isNightMode ? 'Switch to Golden Hour Sunlight' : 'Switch to Twilight Night'}
          className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {isNightMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Reset View */}
        <button
          onClick={() => lerpCamera(defaultPos as any, defaultTarget as any)}
          title="Reset Default Camera View"
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
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Camera Bookmarks Bar (Bottom Center) */}
      {bookmarks.length > 0 && (
        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-1.5 sm:space-x-2 bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-2xl border border-white/10 shadow-2xl z-20 max-w-[92%] overflow-x-auto">
          {bookmarks.map((bm) => (
            <button
              key={bm.id}
              onClick={() => lerpCamera(bm.position, bm.target, bm.fov)}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white/5 hover:bg-blue-600/30 hover:border-blue-500/50 border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200 hover:text-white transition-all whitespace-nowrap cursor-pointer"
            >
              {bm.label}
            </button>
          ))}
        </div>
      )}

      {/* Floor Isolation Selector (Bottom Left or Stacked Above Bookmarks to prevent collision) */}
      {floorMappings.length > 0 && (
        <div className={`absolute ${bookmarks.length > 0 ? 'bottom-14 sm:bottom-16' : 'bottom-3 sm:bottom-4'} left-3 sm:left-4 z-20 flex items-center space-x-1 bg-black/80 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-white/10 max-w-[90%] overflow-x-auto`}>
          <Layers className="w-3.5 h-3.5 text-blue-400 ml-1 shrink-0" />
          <button
            onClick={() => handleIsolateFloor(null)}
            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFloor === null ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Floors
          </button>
          {floorMappings.map((fm) => (
            <button
              key={fm.nodeName}
              onClick={() => handleIsolateFloor(fm.nodeName)}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedFloor === fm.nodeName ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {fm.floorLabel || fm.label || fm.nodeName}
            </button>
          ))}
        </div>
      )}

      {/* 3D Projected Screen Hotspots */}
      {screenHotspots.map(
        (spot) =>
          spot.visible && (
            <div
              key={spot.id}
              style={{ left: `${spot.x}px`, top: `${spot.y}px` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-10 transition-transform hover:scale-110"
            >
              <button
                onClick={() => setActiveHotspot(spot.item)}
                className="relative group p-2 bg-blue-600/90 hover:bg-blue-500 rounded-full border border-white/40 shadow-lg shadow-blue-600/50 backdrop-blur-md transition-all animate-pulse"
              >
                <Info className="w-3.5 h-3.5 text-white" />
                <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 pointer-events-none">
                  {spot.item.label || spot.item.title}
                </span>
              </button>
            </div>
          )
      )}

      {/* Active Hotspot Modal */}
      {activeHotspot && (
        <div className="absolute top-14 sm:top-16 left-3 right-3 sm:left-6 sm:right-auto max-w-xs bg-[#101522]/95 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">{activeHotspot.label || activeHotspot.title}</span>
            <button onClick={() => setActiveHotspot(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">{activeHotspot.description || activeHotspot.content}</p>
          {activeHotspot.specs && (
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 font-mono">
              {activeHotspot.specs}
            </div>
          )}
        </div>
      )}

      {/* Selected Unit Details Modal */}
      {activeUnit && (
        <div className="absolute top-14 sm:top-16 left-3 right-3 sm:left-6 sm:right-auto sm:max-w-sm bg-[#0d121f]/95 backdrop-blur-2xl border border-white/20 p-4 sm:p-5 rounded-2xl shadow-2xl z-30 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-left-4 duration-200">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    activeUnit.status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : activeUnit.status === 'reserved'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {activeUnit.status || 'Available'}
                </span>
                <span className="text-xs text-slate-400 font-medium">{activeUnit.nodeName}</span>
              </div>
              <h4 className="text-lg font-bold text-white mt-1">{activeUnit.unitName || activeUnit.name}</h4>
            </div>
            <button
              onClick={() => setActiveUnit(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-center">
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Bed className="w-3.5 h-3.5" />
                <span>Beds</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{activeUnit.bedrooms || 2}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Bath className="w-3.5 h-3.5" />
                <span>Baths</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{activeUnit.bathrooms || 2}</p>
            </div>
            <div className="p-2 rounded-xl bg-white/[0.03]">
              <div className="flex items-center justify-center space-x-1 text-slate-400 text-[11px]">
                <Building className="w-3.5 h-3.5" />
                <span>Area</span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">{activeUnit.areaSqFt || 1200} sq ft</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Asking Price</p>
              <p className="text-lg font-extrabold text-blue-400">
                {activeUnit.price ? `$${activeUnit.price.toLocaleString()}` : 'Price on Request'}
              </p>
            </div>
            <button
              onClick={() => onInquireUnit?.(activeUnit)}
              className="flex items-center space-x-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              <span>Book VIP Viewing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
