import mongoose, { Schema, Document, Model } from 'mongoose';
import { CalibrationMethod, ScanPoint3D } from '@/lib/scanning/types';

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
  toleranceCm: number; // estimated tolerance in cm
  geometryVersion: number;
  calibrationVersion: number;
  calibrationMethod: CalibrationMethod;
  units: 'metric' | 'imperial' | 'both';
  creationSource: 'user_reference_2pt' | 'user_point_click' | 'sensor_ar' | 'manual_scale';
  roomId?: string;
  createdAt: string;
}

export interface ICalibrationReference extends Document {
  scanId: mongoose.Types.ObjectId;
  version: number;
  scaleFactor: number; // multiplier applied to coordinate units to reach meters
  confidence: number; // 0.0 to 1.0
  referenceType: CalibrationMethod;
  referenceDistanceMeters: number;
  detectedDistanceUnits: number;
  toleranceCm: number;
  measurements: ScanMeasurementItem[];
  notes?: string;
  tenantId?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CalibrationReferenceSchema = new Schema<ICalibrationReference>(
  {
    scanId: { type: Schema.Types.ObjectId, ref: 'PropertyScan', required: true, index: true },
    version: { type: Number, default: 1 },
    scaleFactor: { type: Number, required: true, default: 1.0 },
    confidence: { type: Number, required: true, min: 0, max: 1, default: 0.95 },
    referenceType: {
      type: String,
      enum: ['user_dimension', 'known_marker', 'sensor_ar', 'manual_scale'],
      default: 'manual_scale',
    },
    referenceDistanceMeters: { type: Number, required: true },
    detectedDistanceUnits: { type: Number, required: true },
    toleranceCm: { type: Number, default: 5 },
    measurements: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['distance', 'area', 'height', 'perimeter'], default: 'distance' },
        startPoint: { x: Number, y: Number, z: Number },
        endPoint: { x: Number, y: Number, z: Number },
        measuredMeters: { type: Number, required: true },
        formattedImperial: { type: String, required: true },
        formattedMetric: { type: String, required: true },
        confidenceScore: { type: Number, default: 0.9 },
        toleranceCm: { type: Number, default: 3 },
        geometryVersion: { type: Number, default: 1 },
        calibrationVersion: { type: Number, default: 1 },
        calibrationMethod: { type: String, default: 'manual_scale' },
        units: { type: String, default: 'both' },
        creationSource: { type: String, default: 'user_point_click' },
        roomId: { type: String },
        createdAt: { type: String },
      },
    ],
    notes: { type: String },
    tenantId: { type: String, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CalibrationReference: Model<ICalibrationReference> =
  mongoose.models.CalibrationReference ||
  mongoose.model<ICalibrationReference>('CalibrationReference', CalibrationReferenceSchema);
