import mongoose, { Schema, Document, Model } from 'mongoose';
import { PropertyScanStatus } from '@/lib/scanning/types';

export interface IPropertyScan extends Document {
  propertyId: mongoose.Types.ObjectId;
  title: string;
  status: PropertyScanStatus;
  currentStage?: string;
  roomsCount: number;
  totalFramesCount: number;
  totalSizeBytes: number;
  storageBucket: string;
  storagePrefix: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    screenResolution?: string;
    hasLiDAR?: boolean;
    hasMotionSensors?: boolean;
  };
  metrics?: {
    totalAreaSqFt?: number;
    totalAreaSqMeters?: number;
    ceilingHeightMeters?: number;
    reconstructionAccuracyCm?: number;
  };
  thumbnailUrl?: string;
  isPublic: boolean;
  publicShareToken?: string;
  createdBy: mongoose.Types.ObjectId;
  tenantId?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PropertyScanSchema = new Schema<IPropertyScan>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    title: { type: String, required: true, default: 'Indoor Spatial Scan' },
    status: {
      type: String,
      enum: ['draft', 'capturing', 'uploading', 'processing', 'ready', 'failed'],
      default: 'draft',
      index: true,
    },
    currentStage: { type: String, default: 'queued' },
    roomsCount: { type: Number, default: 0 },
    totalFramesCount: { type: Number, default: 0 },
    totalSizeBytes: { type: Number, default: 0 },
    storageBucket: { type: String, default: 'real-estate-assets' },
    storagePrefix: { type: String, required: true },
    deviceInfo: {
      userAgent: { type: String },
      platform: { type: String },
      screenResolution: { type: String },
      hasLiDAR: { type: Boolean, default: false },
      hasMotionSensors: { type: Boolean, default: false },
    },
    metrics: {
      totalAreaSqFt: { type: Number },
      totalAreaSqMeters: { type: Number },
      ceilingHeightMeters: { type: Number },
      reconstructionAccuracyCm: { type: Number },
    },
    thumbnailUrl: { type: String, default: '' },
    isPublic: { type: Boolean, default: false, index: true },
    publicShareToken: { type: String, sparse: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tenantId: { type: String, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export const PropertyScan: Model<IPropertyScan> =
  mongoose.models.PropertyScan ||
  mongoose.model<IPropertyScan>('PropertyScan', PropertyScanSchema);
