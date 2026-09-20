'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { ViewerCameraMode, ViewerEngine } from '@/lib/scanning/viewerEngine';
import { ScanPoint3D } from '@/lib/scanning/types';
import { Eye, Box, Compass, Layers, RotateCcw, AlertTriangle, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface ThreeSpatialViewerProps {
  scanId: string;
  modelUrl?: string;
  rooms?: Array<{
    id: string;
    name: string;
    center: ScanPoint3D;
    areaSqFt?: number;
  }>;
  topOffset?: string;
  className?: string;
}

export const ThreeSpatialViewer: React.FC<ThreeSpatialViewerProps> = ({
  scanId,
  modelUrl: initialModelUrl,
  rooms = [],
  topOffset,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<ViewerCameraMode>('dollhouse');
  const [activeRoomIndex, setActiveRoomIndex] = useState<number>(0);
  const [fps, setFps] = useState<number>(60);
  const [hasWebGPU, setHasWebGPU] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [loadedFormat, setLoadedFormat] = useState<string>('');
  const [isContextLost, setIsContextLost] = useState<boolean>(false);

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane | null>(null);
  const loadedModelGroupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'gpu' in navigator) {
      setHasWebGPU(true);
    }
  }, []);

  // Update camera mode (dollhouse / first_person / orbit)
  const applyCameraMode = useCallback(
    (mode: ViewerCameraMode) => {
      setCameraMode(mode);
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const renderer = rendererRef.current;
      if (!camera || !controls || !renderer) return;

      if (mode === 'dollhouse') {
        renderer.localClippingEnabled = true;
        camera.position.set(0, 6, 8);
        controls.target.set(0, 1, 0);
        controls.maxPolarAngle = Math.PI / 2.1; // Prevent going beneath floor
      } else if (mode === 'first_person') {
        renderer.localClippingEnabled = false;
        // Position at eye level inside active room
        const activeRoom = rooms[activeRoomIndex];
        const cx = activeRoom?.center?.x || 0;
        const cz = activeRoom?.center?.z || 0;
        camera.position.set(cx, 1.6, cz);
        controls.target.set(cx, 1.6, cz - 3.0);
        controls.maxPolarAngle = Math.PI;
      } else {
        // Orbit mode
        renderer.localClippingEnabled = false;
        camera.position.set(0, 4, 7);
        controls.target.set(0, 1.2, 0);
        controls.maxPolarAngle = Math.PI;
      }
      controls.update();
    },
    [rooms, activeRoomIndex]
  );

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    const factor = direction === 'in' ? 0.75 : 1.35;
    const offset = new THREE.Vector3().subVectors(camera.position, controls.target);
    offset.multiplyScalar(factor);
    camera.position.copy(controls.target).add(offset);
    controls.update();
  }, []);

  const handleResetCamera = useCallback(() => {
    applyCameraMode(cameraMode);
  }, [applyCameraMode, cameraMode]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.set(0, 6, 8);
    cameraRef.current = camera;

    // 3. Renderer with context loss listeners
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setIsContextLost(true);
      console.warn('WebGL context lost. Pausing rendering.');
    };
    const handleContextRestored = () => {
      setIsContextLost(false);
      console.info('WebGL context restored.');
    };

    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls (supports mouse drag, zoom, and touch gestures)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 12, 7);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x3b82f6, 0.3);
    fillLight.position.set(-5, 6, -5);
    scene.add(fillLight);

    // 6. Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x3b82f6, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // 7. Ceiling clipping plane for dollhouse mode
    const ceilingClip = ViewerEngine.createCeilingClippingPlane(2.5);
    clippingPlaneRef.current = ceilingClip;

    // Group for dynamically loaded model
    const modelGroup = new THREE.Group();
    loadedModelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // 8. Dynamic Artifact Loader (Resolves GLB or PLY from scan artifacts API)
    const loadScanArtifact = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        let targetUrl = initialModelUrl;
        let artifactType = 'glb';

        // If no explicit modelUrl provided, fetch artifacts for this scan
        if (!targetUrl && scanId) {
          const res = await fetch(`/api/scans/${scanId}/artifacts`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const meshArt = json.data.find((a: any) => a.type === 'mesh_glb');
            const plyArt = json.data.find((a: any) => a.type === 'pointcloud_ply');
            const chosen = meshArt || plyArt || json.data[0];

            if (chosen) {
              targetUrl = `/api/scans/${scanId}/artifacts/${chosen._id}`;
              artifactType = chosen.type.includes('ply') ? 'ply' : 'glb';
            }
          }
        }

        if (targetUrl) {
          setLoadedFormat(artifactType.toUpperCase());

          if (artifactType === 'glb') {
            const loader = new GLTFLoader();
            loader.load(
              targetUrl,
              (gltf) => {
                modelGroup.clear();
                gltf.scene.traverse((child) => {
                  if ((child as any).isMesh) {
                    const mesh = child as THREE.Mesh;
                    if (mesh.material) {
                      (mesh.material as any).clippingPlanes = [ceilingClip];
                      (mesh.material as any).clipShadows = true;
                    }
                  }
                });
                modelGroup.add(gltf.scene);
                setIsLoading(false);
              },
              undefined,
              (err) => {
                console.warn('GLB load error, rendering fallback geometry:', err);
                renderFallbackRoom(modelGroup, ceilingClip);
                setIsLoading(false);
              }
            );
          } else {
            // PLY point cloud
            const loader = new PLYLoader();
            loader.load(
              targetUrl,
              (geometry) => {
                modelGroup.clear();
                const material = new THREE.PointsMaterial({
                  size: 0.05,
                  vertexColors: geometry.hasAttribute('color'),
                  color: geometry.hasAttribute('color') ? undefined : 0x60a5fa,
                });
                const points = new THREE.Points(geometry, material);
                modelGroup.add(points);
                setIsLoading(false);
              },
              undefined,
              (err) => {
                console.warn('PLY load error, rendering fallback geometry:', err);
                renderFallbackRoom(modelGroup, ceilingClip);
                setIsLoading(false);
              }
            );
          }
        } else {
          // No artifact found yet -> render procedural guidance box
          renderFallbackRoom(modelGroup, ceilingClip);
          setIsLoading(false);
        }
      } catch (err: any) {
        setLoadError('Failed to load spatial artifact: ' + err.message);
        renderFallbackRoom(modelGroup, ceilingClip);
        setIsLoading(false);
      }
    };

    const renderFallbackRoom = (group: THREE.Group, clipPlane: THREE.Plane) => {
      group.clear();
      setLoadedFormat('DEV PROXIES');
      const floorGeo = new THREE.PlaneGeometry(6, 5);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.rotation.x = -Math.PI / 2;
      group.add(floorMesh);

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.7,
        side: THREE.DoubleSide,
        clippingPlanes: [clipPlane],
      });

      const wallNorth = new THREE.Mesh(new THREE.BoxGeometry(6, 2.7, 0.15), wallMat);
      wallNorth.position.set(0, 1.35, -2.5);
      group.add(wallNorth);

      const wallSouth = new THREE.Mesh(new THREE.BoxGeometry(6, 2.7, 0.15), wallMat);
      wallSouth.position.set(0, 1.35, 2.5);
      group.add(wallSouth);

      const wallWest = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 5), wallMat);
      wallWest.position.set(-3, 1.35, 0);
      group.add(wallWest);

      const wallEast = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.7, 5), wallMat);
      wallEast.position.set(3, 1.35, 0);
      group.add(wallEast);
    };

    loadScanArtifact();

    // 9. Animation & FPS Tracker
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (time - lastTime)));
        frameCount = 0;
        lastTime = time;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate(performance.now());

    // 10. Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. Complete Resource Disposal on Unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);

      controls.dispose();

      // Traverse and dispose geometries and materials
      scene.traverse((obj) => {
        if ((obj as any).isMesh || (obj as any).isPoints) {
          const item = obj as THREE.Mesh;
          if (item.geometry) item.geometry.dispose();
          if (item.material) {
            if (Array.isArray(item.material)) {
              item.material.forEach((m) => m.dispose());
            } else {
              item.material.dispose();
            }
          }
        }
      });

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [scanId, initialModelUrl]);

  return (
    <div className={`relative w-full ${className || 'h-[500px] sm:h-[550px]'} bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl`}>
      {/* 3D Canvas Mount with touch-none to prevent scroll locking */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none select-none" />

      {/* Context Lost Alert */}
      {isContextLost && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
          <h3 className="text-base font-semibold text-white">WebGL Graphics Context Suspended</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            The browser reclaimed 3D graphics resources. It will automatically restore once memory is available.
          </p>
        </div>
      )}

      {/* Touch & One-Handed Navigation Control (Zoom in/out, Reset view) */}
      <div className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 shadow-xl pointer-events-auto z-20">
        <button
          onClick={() => handleZoom('in')}
          className="p-2 sm:p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2 sm:p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-slate-800 my-0.5" />
        <button
          onClick={handleResetCamera}
          className="p-2 sm:p-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          title="Reset Camera Angle"
          aria-label="Reset camera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Desktop Top Floating Controls (hidden on mobile to prevent clutter) */}
      <div className={`hidden sm:flex absolute ${topOffset || 'top-4'} left-4 right-4 items-center justify-between gap-2 pointer-events-none z-10`}>
        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-800 pointer-events-auto shadow-lg">
          <button
            onClick={() => applyCameraMode('dollhouse')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              cameraMode === 'dollhouse'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Dollhouse</span>
          </button>
          <button
            onClick={() => applyCameraMode('first_person')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              cameraMode === 'first_person'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Walkthrough</span>
          </button>
          <button
            onClick={() => applyCameraMode('orbit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              cameraMode === 'orbit'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Orbit</span>
          </button>
        </div>

        {/* Telemetry & Capability Badge */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {loadedFormat && (
            <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 text-[11px] rounded-lg font-mono">
              {loadedFormat}
            </span>
          )}
          {hasWebGPU && (
            <span className="px-2.5 py-1 bg-purple-950/60 border border-purple-800/60 text-purple-300 text-[11px] rounded-lg font-mono">
              WebGPU
            </span>
          )}
          <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-emerald-400 text-[11px] rounded-lg font-mono">
            {fps} FPS
          </span>
        </div>
      </div>

      {/* Mobile Top Subtle FPS Pill (< 640px) */}
      <div className="sm:hidden absolute top-2.5 right-2.5 pointer-events-none z-10">
        <span className="px-2 py-0.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 text-emerald-400 text-[10px] rounded-lg font-mono">
          {fps} FPS
        </span>
      </div>

      {/* Mobile Floating Bottom Controls (< 640px) */}
      <div className="sm:hidden absolute bottom-3 inset-x-3 flex flex-col items-center gap-2 pointer-events-none z-20">
        {rooms.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-[11px] text-slate-400">Room:</span>
            <select
              value={activeRoomIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setActiveRoomIndex(idx);
                if (cameraMode === 'first_person') {
                  applyCameraMode('first_person');
                }
              }}
              className="bg-slate-800 text-white text-[11px] rounded-lg px-2 py-0.5 border border-slate-700 focus:outline-none max-w-[160px] truncate"
            >
              {rooms.map((r, i) => (
                <option key={r.id} value={i}>
                  {r.name} {r.areaSqFt ? `(${r.areaSqFt} sq ft)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pointer-events-auto flex items-center justify-around gap-1 p-1 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl w-full max-w-xs">
          <button
            onClick={() => applyCameraMode('dollhouse')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'dollhouse'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Dollhouse</span>
          </button>
          <button
            onClick={() => applyCameraMode('first_person')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'first_person'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Walk</span>
          </button>
          <button
            onClick={() => applyCameraMode('orbit')}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              cameraMode === 'orbit'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Orbit</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center pointer-events-none z-30">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/90 rounded-xl border border-slate-700 text-xs text-slate-300 shadow-xl">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Loading 3D Spatial Artifacts...</span>
          </div>
        </div>
      )}

      {/* Desktop Bottom Floating Room Navigator */}
      {rooms.length > 0 && (
        <div className="hidden sm:flex absolute bottom-4 left-4 max-w-[calc(100%-24px)] pointer-events-auto items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 shadow-lg z-10">
          <Layers className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-xs text-slate-400 shrink-0">Room:</span>
          <select
            value={activeRoomIndex}
            onChange={(e) => {
              const idx = parseInt(e.target.value, 10);
              setActiveRoomIndex(idx);
              if (cameraMode === 'first_person') {
                applyCameraMode('first_person');
              }
            }}
            className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none focus:border-blue-500 max-w-xs truncate"
          >
            {rooms.map((r, i) => (
              <option key={r.id} value={i}>
                {r.name} {r.areaSqFt ? `(${r.areaSqFt} sq ft)` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ThreeSpatialViewer;
