import mongoose, { Schema, Document, Model } from 'mongoose';
import { ArtifactType } from '@/lib/scanning/types';

export interface IScanArtifact extends Document {
  scanId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  type: ArtifactType;
  version: number;
  storageKey: string;
  storageBucket: string;
  fileSizeBytes: number;
  checksumSha256?: string;
  mimeType: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScanArtifactSchema = new Schema<IScanArtifact>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'ScanRoom' },
    type: {
      type: String,
      enum: [
        'mesh_glb',
        'mesh_obj',
        'pointcloud_ply',
        'splat_ply',
        'floorplan_svg',
        'floorplan_json',
        'trajectory_json',
        'thumbnail',
        'raw_frames_zip',
      ],
      required: true,
      index: true,
    },
    version: { type: Number, default: 1 },
    storageKey: { type: String, required: true },
    storageBucket: { type: String, default: 'real-estate-assets' },
    fileSizeBytes: { type: Number, default: 0 },
    checksumSha256: { type: String },
    mimeType: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ScanArtifactSchema.index({ scanId: 1, type: 1, version: -1 });

export const ScanArtifact: Model<IScanArtifact> =
  mongoose.models.ScanArtifact ||
  mongoose.model<IScanArtifact>('ScanArtifact', ScanArtifactSchema);
