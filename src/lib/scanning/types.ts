import { Types } from 'mongoose';

export type PropertyScanStatus =
  | 'draft'
  | 'capturing'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'dining_room'
  | 'hallway'
  | 'office'
  | 'balcony'
  | 'closet'
  | 'garage'
  | 'exterior'
  | 'other';

export type ProcessingStage =
  | 'queued'
  | 'validating'
  | 'camera_tracking'
  | 'sparse_pointcloud'
  | 'dense_reconstruction'
  | 'mesh_generation'
  | 'texturing'
  | 'gaussian_splatting'
  | 'floor_plan_synthesis'
  | 'completed'
  | 'failed';

export type ProcessingJobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ArtifactType =
  | 'mesh_glb'
  | 'mesh_obj'
  | 'pointcloud_ply'
  | 'splat_ply'
  | 'floorplan_svg'
  | 'floorplan_json'
  | 'trajectory_json'
  | 'thumbnail'
  | 'raw_frames_zip';

export type CalibrationMethod =
  | 'user_dimension'
  | 'known_marker'
  | 'sensor_ar'
  | 'manual_scale';

export type ScanAuditAction =
  | 'scan_created'
  | 'capture_started'
  | 'capture_completed'
  | 'chunk_uploaded'
  | 'upload_finalized'
  | 'processing_dispatched'
  | 'stage_completed'
  | 'processing_completed'
  | 'processing_failed'
  | 'artifact_generated'
  | 'room_segmented'
  | 'floorplan_generated'
  | 'floorplan_updated'
  | 'calibrated'
  | 'measurement_added'
  | 'multiroom_aligned'
  | 'scan_deleted'
  | 'viewer_published'
  | 'viewer_revoked';

export interface ScanPoint2D {
  x: number;
  y: number;
}

export interface ScanPoint3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3D {
  min: ScanPoint3D;
  max: ScanPoint3D;
}

export interface CameraPose {
  timestamp: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  euler?: [number, number, number];
  focalLength?: number;
  confidence?: number;
}

export interface KeyframeMetadata {
  index: number;
  timestamp: number;
  blurScore: number;
  brightnessScore: number;
  overlapScore: number;
  motionVelocity: number;
  isAccepted: boolean;
  pose?: CameraPose;
}

export interface DeviceCapabilities {
  hasCamera: boolean;
  hasMotionSensors: boolean;
  hasWebXR: boolean;
  hasDepthSensing: boolean;
  hasLiDAR: boolean;
  hasWebGL2: boolean;
  hasWebGPU: boolean;
  isMobileDevice: boolean;
  estimatedMemoryMB?: number;
  browserFamily: 'ios_safari' | 'android_chrome' | 'desktop' | 'other';
}

export interface ScanMeasurementItem {
  id: string;
  name: string;
  type: 'distance' | 'area' | 'height' | 'perimeter';
  startPoint: ScanPoint3D;
  endPoint: ScanPoint3D;
  measuredMeters: number;
  formattedImperial: string; // e.g. "12' 4\""
  formattedMetric: string; // e.g. "3.76 m"
  confidenceScore: number; // 0.0 to 1.0
  roomId?: string;
  createdAt: string;
}

export interface SemanticOpening {
  id: string;
  type: 'door' | 'window' | 'opening';
  position: ScanPoint3D;
  dimensions: { width: number; height: number; depth?: number };
  normal: ScanPoint3D;
  confidence: number;
  connectingRoomId?: string;
  swingAngle?: number; // for doors
  isVerified?: boolean;
}

export interface SemanticWall {
  id: string;
  startPoint: ScanPoint2D;
  endPoint: ScanPoint2D;
  height: number;
  thickness: number;
  confidence: number;
  openings: SemanticOpening[];
}

export interface FloorPlanVectorData {
  version: number;
  isCalibrated?: boolean;
  calibrationMethod?: CalibrationMethod;
  disclaimer?: string;
  rooms: {
    id: string;
    name: string;
    roomType: RoomType;
    polygon: ScanPoint2D[];
    walls: SemanticWall[];
    openings: SemanticOpening[];
    areaSqMeters: number;
    areaSqFeet: number;
    ceilingHeightMeters: number;
  }[];
  totalAreaSqMeters: number;
  totalAreaSqFeet: number;
  scaleFactor: number; // pixels per meter
}

export interface ReconstructionJobPayload {
  jobId: string;
  scanId: string;
  tenantId: string;
  manifestStorageKey?: string;
  sourceMediaStorageKey: string;
  callbackWebhookUrl?: string;
  webhookSecret?: string;
  options?: {
    denseResolution?: 'standard' | 'high';
    generateSplats?: boolean;
    generateMesh?: boolean;
  };
}

export interface JobStatusReport {
  jobId: string;
  status: ProcessingJobStatus;
  stage: ProcessingStage;
  progress: number;
  stageDetails?: string;
  errorDetails?: string;
  artifactKeys?: {
    meshGlb?: string;
    pointcloudPly?: string;
    splatPly?: string;
  };
}

export interface IReconstructionProvider {
  readonly providerId: string;
  readonly isDevelopmentOnly: boolean;
  dispatchJob(payload: ReconstructionJobPayload): Promise<{ externalJobId: string }>;
  checkJobStatus(externalJobId: string): Promise<JobStatusReport>;
  cancelJob(externalJobId: string): Promise<boolean>;
}

export interface ISemanticSegmentationProvider {
  readonly providerId: string;
  readonly isAiTrainedModel: boolean;
  segmentRoom(params: {
    scanId: string;
    name: string;
    roomType: RoomType;
    bounds: BoundingBox3D;
  }): Promise<{
    walls: SemanticWall[];
    openings: SemanticOpening[];
    confidence: number;
  }>;
}

