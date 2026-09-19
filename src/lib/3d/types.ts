export interface GlbHeader {
  magic: number; // 0x46546C67 ('glTF')
  version: number; // 2
  length: number;
}

export interface GlbBoundingBox {
  min: [number, number, number];
  max: [number, number, number];
}

export interface GlbDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface HierarchyNode {
  name: string;
  index: number;
  path: string;
  children: HierarchyNode[];
  meshIndex?: number;
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
}

export interface GlbMetadata {
  fileSizeBytes: number;
  nodeCount: number;
  meshCount: number;
  materialCount: number;
  textureCount: number;
  triangleCount: number;
  boundingBox: GlbBoundingBox;
  dimensions: GlbDimensions;
  namedNodes: string[];
  extensionsUsed: string[];
  extensionsRequired: string[];
}

export interface CameraFraming {
  center: [number, number, number];
  radius: number;
  recommendedDistance: number;
  recommendedPosition: [number, number, number];
  recommendedTarget: [number, number, number];
  recommendedFov: number;
}

export interface GlbValidationResult {
  valid: boolean;
  error?: string;
  metadata?: GlbMetadata;
  hierarchy?: HierarchyNode[];
  autoFraming?: CameraFraming;
}

export interface MappingCompatibilityReport {
  matched: string[];
  missing: string[];
  unmappedNodes: string[];
}
