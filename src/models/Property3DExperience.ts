import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExperienceStatus =
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'configuration_required'
  | 'published'
  | 'failed'
  | 'archived';

export interface IHotspot3D {
  id: string;
  type?: 'info' | 'unit' | 'floor' | 'amenity' | 'camera_jump' | 'inquiry_cta';
  title?: string;
  label?: string;
  description?: string;
  content?: string;
  specs?: string;
  position: [number, number, number]; // [x, y, z]
  targetLookAt?: [number, number, number];
  targetEntityId?: string;
  action?: string;
}

export interface IWaypoint3D {
  id: string;
  name: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  duration?: number;
}

export interface ICameraBookmark3D {
  id: string;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
  fov?: number;
  order?: number;
}

export interface IFloorMapping3D {
  id?: string;
  floorId?: string;
  label?: string;
  floorLabel?: string;
  nodePath?: string;
  nodeName: string; // Scene graph node name
  levelIndex: number;
  elevation: number;
}

export interface IUnitMapping3D {
  id?: string;
  unitId?: string;
  propertyUnitId?: string;
  name?: string;
  unitName?: string;
  nodePath?: string;
  nodeName: string;
  price?: number;
  status?: 'available' | 'reserved' | 'sold';
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  cameraBookmarkId?: string;
  cameraPos?: [number, number, number];
  lookAt?: [number, number, number];
}

export interface IModelMetadata3D {
  nodeCount: number;
  meshCount: number;
  materialCount: number;
  textureCount: number;
  triangleCount: number;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  namedNodes: string[];
  extensionsUsed: string[];
}

export interface IExperienceVersionSnapshot {
  versionNumber: number;
  publishedAt: Date;
  publishedBy?: mongoose.Types.ObjectId;
  modelUrl: string;
  modelMetadata?: IModelMetadata3D;
  cameraSettings?: any;
  sceneSettings?: any;
  floorMappings?: IFloorMapping3D[];
  unitMappings?: IUnitMapping3D[];
  hotspots?: IHotspot3D[];
}

export interface IProperty3DExperience extends Document {
  propertyId: mongoose.Types.ObjectId;
  title: string;
  status: ExperienceStatus;
  currentVersion: number;
  publishedVersion?: number;
  modelUrl: string;
  format: 'glb' | 'gltf' | 'playcanvas_scene';
  sourceAsset?: {
    url: string;
    fileName: string;
    fileSizeBytes: number;
    storageKey?: string;
    uploadedAt: Date;
  };
  optimizedAsset?: {
    url: string;
    fileSizeBytes: number;
    preset: 'original' | 'balanced' | 'mobile_optimized' | 'high_quality';
    optimizedAt: Date;
  };
  previewImageUrl?: string;
  modelMetadata?: IModelMetadata3D;
  sceneSettings: {
    rootTransform: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    };
    environmentPreset: 'golden_hour' | 'twilight_night' | 'studio_bright' | 'sunset' | 'dark_presentation';
    exposure: number;
    ambientIntensity: number;
    shadowQuality: 'off' | 'low' | 'medium' | 'high';
  };
  cameraSettings: {
    defaultPosition: [number, number, number];
    defaultTarget: [number, number, number];
    fov: number;
    minDistance: number;
    maxDistance: number;
    minPitch: number;
    maxPitch: number;
  };
  bookmarks: ICameraBookmark3D[];
  hotspots: IHotspot3D[];
  waypoints: IWaypoint3D[];
  floorMappings: IFloorMapping3D[];
  unitMappings: IUnitMapping3D[];
  versions: IExperienceVersionSnapshot[];
  isPublished: boolean;
  initialCameraPos: [number, number, number];
  initialLookAt: [number, number, number];
  lightingPreset: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const Property3DExperienceSchema = new Schema<IProperty3DExperience>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, unique: true, index: true },
    title: { type: String, required: true, default: '3D Spatial Architectural Walkthrough' },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'configuration_required', 'published', 'failed', 'archived'],
      default: 'ready',
      index: true,
    },
    currentVersion: { type: Number, default: 1 },
    publishedVersion: { type: Number },
    modelUrl: { type: String, default: '' },
    format: { type: String, enum: ['glb', 'gltf', 'playcanvas_scene'], default: 'glb' },
    sourceAsset: {
      url: { type: String },
      fileName: { type: String },
      fileSizeBytes: { type: Number },
      storageKey: { type: String },
      uploadedAt: { type: Date },
    },
    optimizedAsset: {
      url: { type: String },
      fileSizeBytes: { type: Number },
      preset: { type: String, enum: ['original', 'balanced', 'mobile_optimized', 'high_quality'], default: 'original' },
      optimizedAt: { type: Date },
    },
    previewImageUrl: { type: String, default: '' },
    modelMetadata: {
      nodeCount: { type: Number, default: 0 },
      meshCount: { type: Number, default: 0 },
      materialCount: { type: Number, default: 0 },
      textureCount: { type: Number, default: 0 },
      triangleCount: { type: Number, default: 0 },
      boundingBox: {
        min: { type: [Number], default: [0, 0, 0] },
        max: { type: [Number], default: [0, 0, 0] },
      },
      dimensions: {
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        depth: { type: Number, default: 0 },
      },
      namedNodes: { type: [String], default: [] },
      extensionsUsed: { type: [String], default: [] },
    },
    sceneSettings: {
      rootTransform: {
        position: { type: [Number], default: [0, 0, 0] },
        rotation: { type: [Number], default: [0, 0, 0] },
        scale: { type: [Number], default: [1, 1, 1] },
      },
      environmentPreset: {
        type: String,
        enum: ['golden_hour', 'twilight_night', 'studio_bright', 'sunset', 'dark_presentation'],
        default: 'golden_hour',
      },
      exposure: { type: Number, default: 1.0 },
      ambientIntensity: { type: Number, default: 0.6 },
      shadowQuality: { type: String, enum: ['off', 'low', 'medium', 'high'], default: 'medium' },
    },
    cameraSettings: {
      defaultPosition: { type: [Number], default: [0, 3, 7] },
      defaultTarget: { type: [Number], default: [0, 1, 0] },
      fov: { type: Number, default: 55 },
      minDistance: { type: Number, default: 1 },
      maxDistance: { type: Number, default: 50 },
      minPitch: { type: Number, default: -10 },
      maxPitch: { type: Number, default: 80 },
    },
    bookmarks: [
      {
        id: { type: String, required: true },
        label: { type: String, required: true },
        position: { type: [Number], required: true },
        target: { type: [Number], required: true },
        fov: { type: Number, default: 55 },
        order: { type: Number, default: 0 },
      },
    ],
    hotspots: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ['info', 'unit', 'floor', 'amenity', 'camera_jump', 'inquiry_cta'],
          default: 'info',
        },
        title: { type: String },
        label: { type: String },
        description: { type: String, default: '' },
        content: { type: String, default: '' },
        specs: { type: String, default: '' },
        position: { type: [Number], required: true },
        targetLookAt: { type: [Number] },
        targetEntityId: { type: String },
        action: { type: String },
      },
    ],
    waypoints: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        position: { type: [Number], required: true },
        lookAt: { type: [Number], required: true },
        duration: { type: Number, default: 3.5 },
      },
    ],
    floorMappings: [
      {
        id: { type: String },
        floorId: { type: String },
        label: { type: String },
        floorLabel: { type: String },
        nodePath: { type: String },
        nodeName: { type: String, required: true },
        levelIndex: { type: Number, default: 0 },
        elevation: { type: Number, default: 0 },
      },
    ],
    unitMappings: [
      {
        id: { type: String },
        unitId: { type: String },
        propertyUnitId: { type: String },
        name: { type: String },
        unitName: { type: String },
        nodePath: { type: String },
        nodeName: { type: String, required: true },
        price: { type: Number, default: 0 },
        status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
        bedrooms: { type: Number, default: 2 },
        bathrooms: { type: Number, default: 2 },
        areaSqFt: { type: Number, default: 1200 },
        cameraBookmarkId: { type: String },
        cameraPos: { type: [Number], default: [0, 3, 7] },
        lookAt: { type: [Number], default: [0, 1, 0] },
      },
    ],
    versions: [
      {
        versionNumber: { type: Number, required: true },
        publishedAt: { type: Date, default: Date.now },
        publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        modelUrl: { type: String, required: true },
        modelMetadata: { type: Schema.Types.Mixed },
        cameraSettings: { type: Schema.Types.Mixed },
        sceneSettings: { type: Schema.Types.Mixed },
        floorMappings: { type: [Schema.Types.Mixed], default: [] },
        unitMappings: { type: [Schema.Types.Mixed], default: [] },
        hotspots: { type: [Schema.Types.Mixed], default: [] },
      },
    ],
    isPublished: { type: Boolean, default: false },
    initialCameraPos: { type: [Number], default: [0, 3, 7] },
    initialLookAt: { type: [Number], default: [0, 1, 0] },
    lightingPreset: { type: String, default: 'golden_hour' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Property3DExperience: Model<IProperty3DExperience> =
  mongoose.models.Property3DExperience ||
  mongoose.model<IProperty3DExperience>('Property3DExperience', Property3DExperienceSchema);
