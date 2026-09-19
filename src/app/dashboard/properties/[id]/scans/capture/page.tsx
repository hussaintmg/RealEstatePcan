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
} from 'lucide-react';
import { CameraManager, CameraStreamResult } from '@/lib/scanning/cameraManager';
import { QualityEngine, QualityAssessmentResult } from '@/lib/scanning/qualityEngine';
import { PoseMath, DeviceAngles } from '@/lib/scanning/poseMath';
import { OfflineFrameStore, CachedScanFrame } from '@/lib/scanning/offlineFrameStore';

export default function CameraCapturePage() {
  const params = useParams();
  const router = useRouter();
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

  // Helper to compute SHA-256 in browser
  const computeSha256 = async (buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleStopAndUpload = async () => {
    setIsCapturing(false);
    setIsUploading(true);
    setGuidanceMsg('Retrieving captured binary frames from local cache...');

    try {
      // 1. Fetch real binary frames from IndexedDB
      const cachedFrames = await OfflineFrameStore.getAllFrames(scanId);
      if (!cachedFrames || cachedFrames.length === 0) {
        throw new Error('No captured frames found in local storage. Capture at least one room frame.');
      }

      setGuidanceMsg(`Packaging ${cachedFrames.length} real room capture frames...`);

      // 2. Read blobs into ArrayBuffers and package into sequential chunks
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

      // 4. Upload each chunk with verified SHA-256
      for (let i = 0; i < totalChunks; i++) {
        if (alreadyUploaded.has(i)) {
          setUploadProgress(Math.round(((i + 1) / totalChunks) * 85));
          continue;
        }

        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalBytes);
        const chunkSlice = fullCaptureBuffer.slice(start, end);
        const chunkSha = await computeSha256(chunkSlice.buffer);

        setGuidanceMsg(`Uploading chunk ${i + 1} of ${totalChunks}...`);

        const chunkRes = await fetch(`/api/scans/${scanId}/upload/chunk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-chunk-index': i.toString(),
            'x-chunk-sha256': chunkSha,
          },
          body: chunkSlice,
        });

        const chunkJson = await chunkRes.json();
        if (!chunkJson.success) {
          throw new Error(chunkJson.error || `Chunk ${i} upload failed`);
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
      setGuidanceMsg('Upload complete! Reconstruction pipeline enqueued.');

      // 6. Clean up offline cache upon successful upload
      await OfflineFrameStore.clearScan(scanId).catch(() => {});

      setTimeout(() => {
        router.push(`/dashboard/properties/${propertyId}/scans`);
      }, 1500);
    } catch (err: any) {
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

      {/* Bottom Controls Bar */}
      <div className="relative z-10 w-full p-6 pb-10 flex flex-col items-center gap-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        {isUploading ? (
          <div className="w-full max-w-sm flex flex-col items-center gap-2">
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono">Uploading & Assembling: {uploadProgress}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            {!isCapturing ? (
              <button
                onClick={() => setIsCapturing(true)}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-full font-semibold shadow-xl shadow-blue-600/30 transition-all text-base cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current" />
                {frameCount > 0 ? 'Resume Capture' : 'Start Capture'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsCapturing(false)}
                  className="flex items-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-500 rounded-full text-sm font-medium transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </button>

                <button
                  onClick={handleStopAndUpload}
                  disabled={frameCount === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Finish & Upload ({frameCount})
                </button>
              </>
            )}

            {/* Offline cached indicator */}
            {!isCapturing && frameCount > 0 && (
              <button
                onClick={handleStopAndUpload}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-full text-sm font-semibold transition-all shadow-lg cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                Upload Cached ({frameCount})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
