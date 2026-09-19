import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICaptureChunk {
  chunkIndex: number;
  sizeBytes: number;
  checksumSha256: string;
  storageKey: string;
  uploadedAt: Date;
}

export interface ICaptureSession extends Document {
  scanId: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  chunkSize: number;
  totalChunks: number;
  totalBytesExpected: number;
  totalBytesUploaded: number;
  chunks: ICaptureChunk[];
  manifestData?: any;
  isFinalized: boolean;
  finalizedAt?: Date;
  assembledFileKey?: string;
  assembledChecksumSha256?: string;
  expiresAt: Date;
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CaptureChunkSchema = new Schema<ICaptureChunk>(
  {
    chunkIndex: { type: Number, required: true },
    sizeBytes: { type: Number, required: true },
    checksumSha256: { type: String, required: true },
    storageKey: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CaptureSessionSchema = new Schema<ICaptureSession>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    roomId: { type: Schema.Types.ObjectId, ref: 'ScanRoom' },
    chunkSize: { type: Number, default: 5 * 1024 * 1024 }, // 5MB default chunk
    totalChunks: { type: Number, required: true },
    totalBytesExpected: { type: Number, required: true },
    totalBytesUploaded: { type: Number, default: 0 },
    chunks: [CaptureChunkSchema],
    manifestData: { type: Schema.Types.Mixed },
    isFinalized: { type: Boolean, default: false, index: true },
    finalizedAt: { type: Date },
    assembledFileKey: { type: String },
    assembledChecksumSha256: { type: String },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CaptureSession: Model<ICaptureSession> =
  mongoose.models.CaptureSession ||
  mongoose.model<ICaptureSession>('CaptureSession', CaptureSessionSchema);
