'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Camera,
  Play,
  Pause,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Compass,
  RotateCw,
  RefreshCw,
  SwitchCamera,
  FolderUp,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { CameraManager, CameraStreamResult } from '@/lib/scanning/cameraManager';
import { QualityEngine, QualityAssessmentResult } from '@/lib/scanning/qualityEngine';
import { PoseMath, DeviceAngles } from '@/lib/scanning/poseMath';
import { OfflineFrameStore, CachedScanFrame } from '@/lib/scanning/offlineFrameStore';

export default function CameraCapturePage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = (params?.id as string) || '';
  const searchParams = useSearchParams();
  const initialScanId = searchParams?.get('scanId') || '';
  const [scanId, setScanId] = useState<string>(initialScanId);

  // If scanId is missing from query string, auto-create a draft scan session
  useEffect(() => {
    if (scanId || !propertyId) return;

    fetch(`/api/properties/${propertyId}/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Camera Scan ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?._id) {
          setScanId(json.data._id);
          window.history.replaceState(
            null,
            '',
            `/dashboard/properties/${propertyId}/scans/capture?scanId=${json.data._id}`
          );
        }
      })
      .catch((err) => console.warn('Could not auto-create scan session:', err));
  }, [propertyId, scanId]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const evalCanvasRef = useRef<HTMLCanvasElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);

  const [streamResult, setStreamResult] = useState<CameraStreamResult | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [frameCount, setFrameCount] = useState<number>(0);
  const [coveragePct, setCoveragePct] = useState<number>(0);
  const [guidanceMsg, setGuidanceMsg] = useState<string>('Align room and press "Start Capture"');
  const [error, setError] = useState<string>('');
  const [recoveredFramesCount, setRecoveredFramesCount] = useState<number>(0);

  const currentAngles = useRef<DeviceAngles>({ alpha: 0, beta: 0, gamma: 0 });
  const prevAngles = useRef<{ angles: DeviceAngles; timestamp: number } | null>(null);
  const capturedPoses = useRef<Array<[number, number, number, number]>>([]);
  const frameIntervalRef = useRef<any>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingMedia, setIsProcessingMedia] = useState<boolean>(false);

  // Check for recovered offline frames from a previous/interrupted session
  useEffect(() => {
    if (!scanId) return;
    OfflineFrameStore.getAllFrames(scanId)
      .then((frames) => {
        if (frames && frames.length > 0) {
          setRecoveredFramesCount(frames.length);
          setFrameCount(frames.length);
          capturedPoses.current = frames.map((f) => f.poseQuaternion);
          const cov = QualityEngine.estimateCoverage(capturedPoses.current, 36);
          setCoveragePct(cov.percentage);
          setGuidanceMsg(`Recovered ${frames.length} frames from previous session. Continue capture or Finish & Upload.`);
        }
      })
      .catch(() => {});
  }, [scanId]);

  // Handler for uploading local room photos/video files
  const handleMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !scanId) return;

    setIsProcessingMedia(true);
    setGuidanceMsg(`Processing ${files.length} room photos/media from device...`);

    try {
      let added = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const img = new Image();
          const objUrl = URL.createObjectURL(file);
          await new Promise<void>((resolve) => {
            img.onload = async () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width || 1280;
              canvas.height = img.height || 720;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const idx = capturedPoses.current.length + 1;
                  const pose: [number, number, number, number] = [0, 0, 0, 1];
                  capturedPoses.current.push(pose);
                  await OfflineFrameStore.storeFrame({
                    scanId,
                    frameIndex: idx,
                    timestamp: Date.now(),
                    blob,
                    mimeType: 'image/jpeg',
                    blurScore: 120,
                    brightnessScore: 120,
                    overlapScore: 0.8,
                    motionVelocity: 1,
                    poseQuaternion: pose,
                    isUploaded: false,
                  });
                  added++;
                  setFrameCount(idx);
                }
                URL.revokeObjectURL(objUrl);
                resolve();
              }, 'image/jpeg', 0.88);
            };
            img.onerror = () => {
              URL.revokeObjectURL(objUrl);
              resolve();
            };
            img.src = objUrl;
          });
        }
      }

      const allFrames = await OfflineFrameStore.getAllFrames(scanId);
      setFrameCount(allFrames.length);
      const cov = QualityEngine.estimateCoverage(capturedPoses.current, 36);
      setCoveragePct(cov.percentage || Math.min(allFrames.length * 6, 100));
      setGuidanceMsg(`Loaded ${allFrames.length} frames into scan cache. Ready to Upload.`);
    } catch (err: any) {
      setError('Media import error: ' + err.message);
    } finally {
      setIsProcessingMedia(false);
      if (e.target) e.target.value = '';
    }
  };

  // Start or switch camera stream
  const startCamera = useCallback(async (mode: 'environment' | 'user') => {
    setError('');
    try {
      if (activeStreamRef.current) {
        CameraManager.stopStream(activeStreamRef.current);
        activeStreamRef.current = null;
      }

      await CameraManager.requestOrientationPermission();

      const camResult = await CameraManager.requestCameraStream(mode);
      setStreamResult(camResult);
      activeStreamRef.current = camResult.stream;

      if (videoRef.current) {
        videoRef.current.srcObject = camResult.stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setError(
        err.message ||
        'Camera permission was denied. Please allow camera access in your browser settings and reload.'
      );
    }
  }, []);

  // Initialize camera and orientation sensors on mount
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      currentAngles.current = {
        alpha: e.alpha,
        beta: e.beta,
        gamma: e.gamma,
      };
    };
    window.addEventListener('deviceorientation', handleOrientation);

    startCamera(facingMode);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      if (activeStreamRef.current) {
        CameraManager.stopStream(activeStreamRef.current);
        activeStreamRef.current = null;
      }
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [facingMode, startCamera]);

  const handleToggleCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
  };

  // Capture & Quality Engine loop (runs every 300ms while isCapturing is true)
  useEffect(() => {
    if (!isCapturing || !videoRef.current || !evalCanvasRef.current) return;

    frameIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const evalCanvas = evalCanvasRef.current;
      if (!video || !evalCanvas || video.readyState < 2) return;

      const evalCtx = evalCanvas.getContext('2d');
      if (!evalCtx) return;

      // Draw downscaled frame (320x180) for real-time quality evaluation
      const sampleW = 320;
      const sampleH = 180;
      evalCanvas.width = sampleW;
      evalCanvas.height = sampleH;
      evalCtx.drawImage(video, 0, 0, sampleW, sampleH);

      const imgData = evalCtx.getImageData(0, 0, sampleW, sampleH);

      // Compute motion velocity
      const now = performance.now();
      let velocity = 0;
      if (prevAngles.current) {
        const velRes = PoseMath.computeAngularVelocity(prevAngles.current, {
          angles: currentAngles.current,
          timestamp: now,
        });
        velocity = velRes.magnitude;
      }
      prevAngles.current = { angles: { ...currentAngles.current }, timestamp: now };

      const currPoseQ = PoseMath.eulerToQuaternion(currentAngles.current);
      const prevPoseQ =
        capturedPoses.current.length > 0
          ? capturedPoses.current[capturedPoses.current.length - 1]
          : undefined;

      // Run quality evaluation
      const quality: QualityAssessmentResult = QualityEngine.evaluateFrameQuality({
        imageData: imgData,
        width: sampleW,
        height: sampleH,
        motionVelocity: velocity,
        currPoseQuaternion: currPoseQ,
        prevPoseQuaternion: prevPoseQ,
      });

      setGuidanceMsg(quality.guidanceMessage);

      // Accept frame if quality passes
      if (quality.isAccepted) {
        capturedPoses.current.push(currPoseQ);
        const newIndex = capturedPoses.current.length;
        setFrameCount(newIndex);

        // Update coverage
        const cov = QualityEngine.estimateCoverage(capturedPoses.current, 36);
        setCoveragePct(cov.percentage);

        // Capture full-resolution JPEG blob
        const capCanvas = captureCanvasRef.current;
        if (capCanvas) {
          const capW = video.videoWidth || 1280;
          const capH = video.videoHeight || 720;
          capCanvas.width = capW;
          capCanvas.height = capH;
          const capCtx = capCanvas.getContext('2d');
          if (capCtx) {
            capCtx.drawImage(video, 0, 0, capW, capH);
            capCanvas.toBlob(
              (blob) => {
                if (blob && scanId) {
                  OfflineFrameStore.storeFrame({
                    scanId,
                    frameIndex: newIndex,
                    timestamp: Date.now(),
                    blob,
                    mimeType: 'image/jpeg',
                    blurScore: quality.blurScore,
                    brightnessScore: quality.meanLuminance,
                    overlapScore: quality.overlapScore,
                    motionVelocity: velocity,
                    poseQuaternion: currPoseQ,
                    isUploaded: false,
                  }).catch((err) => console.warn('Failed to cache frame to IndexedDB:', err));
                }
              },
              'image/jpeg',
              0.88
            );
          }
        }
      }
    }, 300);

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    };
  }, [isCapturing, scanId]);

  // Pure JS SHA-256 implementation fallback for non-secure HTTP contexts or mobile webviews
  const sha256Fallback = (bytes: Uint8Array): string => {
    const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));
    const ch = (x: number, y: number, z: number) => (x & y) ^ (~x & z);
    const maj = (x: number, y: number, z: number) => (x & y) ^ (x & z) ^ (y & z);
    const sigma0 = (x: number) => rotr(2, x) ^ rotr(13, x) ^ rotr(22, x);
    const sigma1 = (x: number) => rotr(6, x) ^ rotr(11, x) ^ rotr(25, x);
    const gamma0 = (x: number) => rotr(7, x) ^ rotr(18, x) ^ (x >>> 3);
    const gamma1 = (x: number) => rotr(17, x) ^ rotr(19, x) ^ (x >>> 10);

    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];

    const H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    const l = bytes.length;
    const bitLen = l * 8;
    const padLen = (l % 64 < 56) ? (56 - (l % 64)) : (120 - (l % 64));
    const totalLen = l + padLen + 8;
    const padded = new Uint8Array(totalLen);
    padded.set(bytes, 0);
    padded[l] = 0x80;

    const view = new DataView(padded.buffer);
    view.setUint32(totalLen - 4, bitLen >>> 0);
    view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000));

    const W = new Uint32Array(64);

    for (let i = 0; i < totalLen; i += 64) {
      for (let t = 0; t < 16; t++) {
        W[t] = view.getUint32(i + t * 4);
      }
      for (let t = 16; t < 64; t++) {
        W[t] = (gamma1(W[t - 2]) + W[t - 7] + gamma0(W[t - 15]) + W[t - 16]) >>> 0;
      }

      let a = H[0], b = H[1], c = H[2], d = H[3];
      let e = H[4], f = H[5], g = H[6], h = H[7];

      for (let t = 0; t < 64; t++) {
        const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
        const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
        h = g;
        g = f;
        f = e;
        e = (d + T1) >>> 0;
        d = c;
        c = b;
        b = a;
        a = (T1 + T2) >>> 0;
      }

      H[0] = (H[0] + a) >>> 0;
      H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0;
      H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0;
      H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0;
      H[7] = (H[7] + h) >>> 0;
    }

    return H.map((val) => (val >>> 0).toString(16).padStart(8, '0')).join('');
  };

  // Helper to compute SHA-256 for an exact byte array
  const computeSha256 = async (bytes: Uint8Array): Promise<string> => {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Create an isolated ArrayBuffer containing ONLY the chunk bytes
        const exactAb = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', exactAb);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {
      console.warn('Crypto.subtle unavailable or failed, using JS SHA-256 fallback:', e);
    }
    return sha256Fallback(bytes);
  };

  const handleStopAndUpload = async () => {
    setIsCapturing(false);
    setIsUploading(true);
    setGuidanceMsg('Retrieving captured room frames from local storage cache...');
    setError('');

    try {
      // 1. Fetch real binary frames from IndexedDB
      const cachedFrames = await OfflineFrameStore.getAllFrames(scanId);
      if (!cachedFrames || cachedFrames.length === 0) {
        throw new Error('No captured frames found in local storage. Please capture or select at least 1 room frame.');
      }

      setGuidanceMsg(`Packaging ${cachedFrames.length} captured room frames...`);

      // 2. Read blobs into ArrayBuffers and calculate exact total bytes
      const frameBuffers: Uint8Array[] = [];
      let totalBytes = 0;
      for (const f of cachedFrames) {
        const ab = await f.blob.arrayBuffer();
        const u8 = new Uint8Array(ab);
        frameBuffers.push(u8);
        totalBytes += u8.byteLength;
      }

      // Concatenate into single unified capture buffer
      const fullCaptureBuffer = new Uint8Array(totalBytes);
      let offset = 0;
      for (const fb of frameBuffers) {
        fullCaptureBuffer.set(fb, offset);
        offset += fb.byteLength;
      }

      // Split into 2MB chunks
      const CHUNK_SIZE = 2 * 1024 * 1024;
      const totalChunks = Math.max(Math.ceil(totalBytes / CHUNK_SIZE), 1);

      // 3. Call upload/init
      setGuidanceMsg(`Initiating upload session for ${totalChunks} chunks (${(totalBytes / (1024 * 1024)).toFixed(2)} MB)...`);
      const initRes = await fetch(`/api/scans/${scanId}/upload/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalChunks,
          chunkSize: CHUNK_SIZE,
          totalBytesExpected: totalBytes,
          manifestData: {
            totalFrames: cachedFrames.length,
            deviceFacingMode: facingMode,
            capturedAt: new Date().toISOString(),
          },
        }),
      });

      const initJson = await initRes.json();
      if (!initJson.success) {
        throw new Error(initJson.error || 'Failed to initialize upload session');
      }

      const alreadyUploaded = new Set<number>(initJson.data.uploadedChunkIndices || []);

      // 4. Upload each chunk with isolated buffer & verified SHA-256
      for (let i = 0; i < totalChunks; i++) {
        if (alreadyUploaded.has(i)) {
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 85));
          continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalBytes);
        // Important: Create a detached, exact-length Uint8Array copy so .buffer byteLength is strictly the chunk size
        const exactChunk = new Uint8Array(fullCaptureBuffer.subarray(start, end));
        const chunkSha = await computeSha256(exactChunk);

        setGuidanceMsg(`Uploading chunk ${i + 1} of ${totalChunks} (${(exactChunk.byteLength / 1024).toFixed(0)} KB)...`);

        const chunkRes = await fetch(`/api/scans/${scanId}/upload/chunk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-chunk-index': i.toString(),
            'x-chunk-sha256': chunkSha,
          },
          body: exactChunk,
        });

        const chunkJson = await chunkRes.json();
        if (!chunkJson.success) {
          throw new Error(chunkJson.error || `Chunk ${i + 1} upload failed`);
        }

        setUploadProgress(Math.round(((i + 1) / totalChunks) * 85));
      }

      // 5. Finalize upload session
      setGuidanceMsg('Verifying and assembling server payload...');
      setUploadProgress(92);

      const finalizeRes = await fetch(`/api/scans/${scanId}/upload/finalize`, {
        method: 'POST',
      });
      const finalizeJson = await finalizeRes.json();
      if (!finalizeJson.success) {
        throw new Error(finalizeJson.error || 'Upload finalization failed');
      }

      setUploadProgress(100);
      setGuidanceMsg('Upload complete! 3D reconstruction pipeline enqueued.');

      // 6. Clean up offline cache upon successful upload
      await OfflineFrameStore.clearScan(scanId).catch(() => {});

      setTimeout(() => {
        router.push(`/dashboard/properties/${propertyId}/scans`);
      }, 1200);
    } catch (err: any) {
      console.error('Scan upload exception:', err);
      setError('Upload failed: ' + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-between text-white font-sans select-none">
      {/* Viewfinder Video Stream */}
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      {/* Hidden canvases: eval for 300ms downscaled loop, capture for high-res JPEG */}
      <canvas ref={evalCanvasRef} className="hidden" />
      <canvas ref={captureCanvasRef} className="hidden" />

      {/* Permission Denied Recovery Banner */}
      {error && (
        <div className="absolute inset-x-4 top-16 z-30 p-4 bg-red-950/95 border border-red-700/80 rounded-2xl shadow-2xl backdrop-blur-md max-w-lg mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-200">Camera Access Error</h4>
              <p className="text-xs text-red-300 mt-1 leading-relaxed">{error}</p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="px-3 py-1.5 bg-red-800 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Access
                </button>
                <span className="text-[11px] text-red-400">
                  Tip: Check address bar icon to grant permission.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD Overlay */}
      <div className="relative z-10 w-full p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={() => router.push(`/dashboard/properties/${propertyId}/scans`)}
          className="p-2.5 rounded-full bg-slate-900/70 backdrop-blur-md border border-slate-700 hover:bg-slate-800 text-white shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          {/* Switch Camera Button */}
          <button
            onClick={handleToggleCamera}
            disabled={isCapturing || isUploading}
            title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Rear'} Camera`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 backdrop-blur-md hover:bg-slate-800 disabled:opacity-50 rounded-xl border border-slate-700 text-xs text-slate-200 cursor-pointer shadow-lg"
          >
            <SwitchCamera className="w-4 h-4 text-blue-400" />
            <span className="capitalize">{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-700 text-xs">
            <Compass className="w-4 h-4 text-blue-400" />
            <span>Coverage: <b className="text-blue-400 font-mono">{coveragePct}%</b></span>
          </div>

          <div className="px-3 py-1.5 bg-slate-900/70 backdrop-blur-md rounded-xl border border-slate-700 text-xs font-mono">
            {frameCount} Frames
          </div>
        </div>
      </div>

      {/* Center Reticle & Live Guidance Badge */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div
          className={`w-48 h-48 rounded-full border-2 border-dashed flex items-center justify-center transition-all ${
            isCapturing
              ? 'border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
              : 'border-slate-500/50'
          }`}
        >
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
        </div>

        <div className="px-4 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-700 rounded-full text-xs font-medium text-center shadow-lg text-slate-200 max-w-sm">
          {guidanceMsg}
        </div>
      </div>

      {/* Hidden file input for mobile photo library / file selection */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleMediaFilesSelected}
        className="hidden"
      />

      {/* Bottom Controls Bar */}
      <div className="relative z-10 w-full p-4 sm:p-6 pb-8 sm:pb-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent">
        {isUploading ? (
          <div className="w-full max-w-sm flex flex-col items-center gap-2">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-slate-300 font-mono">Uploading & Assembling Chunks: {uploadProgress}%</span>
          </div>
        ) : (
          <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-3">
            {!isCapturing ? (
              <>
                <button
                  onClick={() => setIsCapturing(true)}
                  className="flex items-center gap-2.5 px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full font-semibold shadow-xl shadow-blue-600/30 transition-all text-sm sm:text-base cursor-pointer"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                  {frameCount > 0 ? 'Resume Capture' : 'Start Capture'}
                </button>

                <button
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isProcessingMedia}
                  className="flex items-center gap-2 px-5 py-3.5 bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 text-slate-200 rounded-full font-medium text-xs sm:text-sm border border-slate-700 backdrop-blur-md transition-all cursor-pointer"
                  title="Upload photos or videos taken with device camera"
                >
                  {isProcessingMedia ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <FolderUp className="w-4 h-4 text-blue-400" />
                  )}
                  {isProcessingMedia ? 'Importing...' : 'Upload Room Photos'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsCapturing(false)}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </button>

                <button
                  onClick={handleStopAndUpload}
                  disabled={frameCount === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Finish & Upload ({frameCount})
                </button>
              </>
            )}

            {/* Offline cached indicator / upload button */}
            {!isCapturing && frameCount > 0 && (
              <button
                onClick={handleStopAndUpload}
                className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-full text-xs sm:text-sm font-semibold text-white transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Finish & Upload ({frameCount} Frames)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
