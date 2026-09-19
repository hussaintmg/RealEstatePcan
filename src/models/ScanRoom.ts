import mongoose, { Schema, Document, Model } from 'mongoose';
import { RoomType, ScanPoint2D, BoundingBox3D } from '@/lib/scanning/types';

export interface IScanRoom extends Document {
  scanId: mongoose.Types.ObjectId;
  name: string;
  roomType: RoomType;
  dimensions: {
    lengthMeters: number;
    widthMeters: number;
    heightMeters: number;
    areaSqMeters: number;
    areaSqFt: number;
  };
  polygon: ScanPoint2D[];
  boundingBox3D?: BoundingBox3D;
  keyframeCount: number;
  assignedOrder: number;
  status: 'capturing' | 'captured' | 'processed';
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScanRoomSchema = new Schema<IScanRoom>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    name: { type: String, required: true, default: 'Living Area' },
    roomType: {
      type: String,
      enum: [
        'living_room',
        'bedroom',
        'bathroom',
        'kitchen',
        'dining_room',
        'hallway',
        'office',
        'balcony',
        'closet',
        'garage',
        'exterior',
        'other',
      ],
      default: 'living_room',
    },
    dimensions: {
      lengthMeters: { type: Number, default: 0 },
      widthMeters: { type: Number, default: 0 },
      heightMeters: { type: Number, default: 2.7 },
      areaSqMeters: { type: Number, default: 0 },
      areaSqFt: { type: Number, default: 0 },
    },
    polygon: [
      {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
      },
    ],
    boundingBox3D: {
      min: { x: Number, y: Number, z: Number },
      max: { x: Number, y: Number, z: Number },
    },
    keyframeCount: { type: Number, default: 0 },
    assignedOrder: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['capturing', 'captured', 'processed'],
      default: 'capturing',
    },
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ScanRoom: Model<IScanRoom> =
  mongoose.models.ScanRoom || mongoose.model<IScanRoom>('ScanRoom', ScanRoomSchema);
