import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHotspot3D {
  id: string;
  title: string;
  description: string;
  specs?: string;
  position: [number, number, number]; // [x, y, z]
  targetLookAt?: [number, number, number];
}

export interface IWaypoint3D {
  id: string;
  name: string;
  position: [number, number, number];
  lookAt: [number, number, number];
  duration?: number;
}

export interface IFloorMapping3D {
  floorId: string;
  label: string;
  nodeName: string; // Scene graph node name
  levelIndex: number;
  elevation: number;
}

export interface IUnitMapping3D {
  unitId: string;
  name: string;
  nodeName: string;
  price: number;
  status: 'available' | 'reserved' | 'sold';
  bedrooms: number;
  bathrooms: number;
  areaSqFt: number;
  cameraPos: [number, number, number];
  lookAt: [number, number, number];
}

export interface IProperty3DExperience extends Document {
  propertyId: mongoose.Types.ObjectId;
  title: string;
  modelUrl: string;
  format: 'glb' | 'gltf' | 'playcanvas_scene';
  isPublished: boolean;
  initialCameraPos: [number, number, number];
  initialLookAt: [number, number, number];
  hotspots: IHotspot3D[];
  waypoints: IWaypoint3D[];
  floorMappings: IFloorMapping3D[];
  unitMappings: IUnitMapping3D[];
  lightingPreset: 'golden_hour' | 'twilight_night' | 'studio_bright';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const Property3DExperienceSchema = new Schema<IProperty3DExperience>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, unique: true, index: true },
    title: { type: String, required: true, default: '3D Spatial Architectural Walkthrough' },
    modelUrl: { type: String, default: '' },
    format: { type: String, enum: ['glb', 'gltf', 'playcanvas_scene'], default: 'glb' },
    isPublished: { type: Boolean, default: true },
    initialCameraPos: { type: [Number], default: [0, 3, 7] },
    initialLookAt: { type: [Number], default: [0, 1, 0] },
    hotspots: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        specs: { type: String, default: '' },
        position: { type: [Number], required: true },
        targetLookAt: { type: [Number] },
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
        floorId: { type: String, required: true },
        label: { type: String, required: true },
        nodeName: { type: String, required: true },
        levelIndex: { type: Number, default: 0 },
        elevation: { type: Number, default: 0 },
      },
    ],
    unitMappings: [
      {
        unitId: { type: String, required: true },
        name: { type: String, required: true },
        nodeName: { type: String, required: true },
        price: { type: Number, default: 0 },
        status: { type: String, enum: ['available', 'reserved', 'sold'], default: 'available' },
        bedrooms: { type: Number, default: 2 },
        bathrooms: { type: Number, default: 2 },
        areaSqFt: { type: Number, default: 1200 },
        cameraPos: { type: [Number], default: [0, 3, 7] },
        lookAt: { type: [Number], default: [0, 1, 0] },
      },
    ],
    lightingPreset: {
      type: String,
      enum: ['golden_hour', 'twilight_night', 'studio_bright'],
      default: 'golden_hour',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Property3DExperience: Model<IProperty3DExperience> =
  mongoose.models.Property3DExperience ||
  mongoose.model<IProperty3DExperience>('Property3DExperience', Property3DExperienceSchema);
