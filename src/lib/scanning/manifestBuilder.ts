import { KeyframeMetadata, CameraPose } from './types';

export interface CaptureManifest {
  manifestVersion: string;
  scanId: string;
  createdAt: string;
  deviceInfo: {
    browserFamily: string;
    isMobile: boolean;
    userAgent: string;
    hasLiDAR: boolean;
  };
  cameraIntrinsics: {
    width: number;
    height: number;
    fx: number;
    fy: number;
    cx: number;
    cy: number;
    estimatedFovDeg: number;
  };
  totalFrames: number;
  acceptedKeyframesCount: number;
  keyframes: {
    index: number;
    timestamp: number;
    relativeImagePath: string;
    blurScore: number;
    brightnessScore: number;
    overlapScore: number;
    motionVelocity: number;
    pose: CameraPose;
  }[];
  rooms?: {
    id: string;
    name: string;
    roomType: string;
    startFrameIndex: number;
    endFrameIndex: number;
  }[];
}

export class ManifestBuilder {
  static buildManifest(
    scanId: string,
    frames: Array<{
      index: number;
      timestamp: number;
      blurScore: number;
      brightnessScore: number;
      overlapScore: number;
      motionVelocity: number;
      poseQuaternion: [number, number, number, number];
      relativeImagePath?: string;
    }>,
    intrinsics: {
      width: number;
      height: number;
      fx: number;
      fy: number;
      cx: number;
      cy: number;
      fov: number;
    },
    deviceInfo: {
      browserFamily: string;
      isMobile: boolean;
      userAgent: string;
      hasLiDAR: boolean;
    },
    rooms?: Array<{
      id: string;
      name: string;
      roomType: string;
      startFrameIndex: number;
      endFrameIndex: number;
    }>
  ): CaptureManifest {
    const keyframes = frames.map((f) => ({
      index: f.index,
      timestamp: f.timestamp,
      relativeImagePath: f.relativeImagePath || `frames/frame_${String(f.index).padStart(5, '0')}.jpg`,
      blurScore: f.blurScore,
      brightnessScore: f.brightnessScore,
      overlapScore: f.overlapScore,
      motionVelocity: f.motionVelocity,
      pose: {
        timestamp: f.timestamp,
        position: [0, 0, 0] as [number, number, number],
        quaternion: f.poseQuaternion,
      },
    }));

    return {
      manifestVersion: '1.0.0',
      scanId,
      createdAt: new Date().toISOString(),
      deviceInfo,
      cameraIntrinsics: {
        width: intrinsics.width,
        height: intrinsics.height,
        fx: intrinsics.fx,
        fy: intrinsics.fy,
        cx: intrinsics.cx,
        cy: intrinsics.cy,
        estimatedFovDeg: intrinsics.fov,
      },
      totalFrames: frames.length,
      acceptedKeyframesCount: keyframes.length,
      keyframes,
      rooms: rooms || [],
    };
  }
}
