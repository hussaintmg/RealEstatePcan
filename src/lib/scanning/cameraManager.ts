import { DeviceCapabilities } from './types';

export interface CameraStreamResult {
  stream: MediaStream;
  actualWidth: number;
  actualHeight: number;
  actualFps: number;
  facingMode: string;
}

export class CameraManager {
  /**
   * Probes and resolves client device hardware capabilities.
   */
  static detectCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined') {
      return {
        hasCamera: false,
        hasMotionSensors: false,
        hasWebXR: false,
        hasDepthSensing: false,
        hasLiDAR: false,
        hasWebGL2: false,
        hasWebGPU: false,
        isMobileDevice: false,
        browserFamily: 'other',
      };
    }

    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid || /Mobile/.test(ua);

    let hasWebGL2 = false;
    try {
      const canvas = document.createElement('canvas');
      hasWebGL2 = !!canvas.getContext('webgl2');
    } catch {
      hasWebGL2 = false;
    }

    return {
      hasCamera: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      hasMotionSensors: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window,
      hasWebXR: 'xr' in navigator,
      hasDepthSensing: false, // Standard RGB default without LiDAR requirement
      hasLiDAR: false,
      hasWebGL2,
      hasWebGPU: 'gpu' in navigator,
      isMobileDevice: isMobile,
      browserFamily: isIOS ? 'ios_safari' : isAndroid ? 'android_chrome' : 'desktop',
    };
  }

  /**
   * Requests device orientation permissions (critical for iOS 13+).
   */
  static async requestOrientationPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const res = await (DeviceOrientationEvent as any).requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return true; // Android & desktop browsers grant without permission prompt
  }

  /**
   * Connects to device camera applying ladder of constraints from 1080p -> 720p -> standard,
   * supporting toggling between 'environment' (rear) and 'user' (front) cameras.
   */
  static async requestCameraStream(
    preferredFacingMode: 'environment' | 'user' = 'environment'
  ): Promise<CameraStreamResult> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Camera access API (getUserMedia) is not supported in this browser.');
    }

    // Constraint priority list
    const constraintLadder: MediaStreamConstraints[] = [
      // 1. High-definition 1080p facing preferred camera
      {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      },
      // 2. Fallback 720p facing preferred camera
      {
        video: {
          facingMode: { ideal: preferredFacingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      },
      // 3. Baseline video stream with preferred facing mode
      {
        video: {
          facingMode: { ideal: preferredFacingMode },
        },
        audio: false,
      },
      // 4. Any available camera
      {
        video: true,
        audio: false,
      },
    ];

    let lastError: any = null;

    for (const constraints of constraintLadder) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings ? track.getSettings() : ({} as MediaTrackSettings);

        return {
          stream,
          actualWidth: settings.width || 1280,
          actualHeight: settings.height || 720,
          actualFps: settings.frameRate || 30,
          facingMode: settings.facingMode || preferredFacingMode,
        };
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    throw new Error(
      lastError?.message ||
        'Unable to access camera. Please check camera permissions in your browser settings.'
    );
  }

  /**
   * Stops all active tracks on a MediaStream.
   */
  static stopStream(stream: MediaStream | null): void {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }
}
