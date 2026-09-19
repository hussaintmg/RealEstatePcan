import { CalibrationReference, ICalibrationReference, ScanMeasurementItem } from '@/models/CalibrationReference';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanArtifact } from '@/models/ScanArtifact';
import { ScanService } from './scanService';
import { CalibrationMethod, ScanPoint3D } from './types';
import { TokenPayload } from '@/lib/session';

export class CalibrationService {
  /**
   * Formats distance in meters to standard US/Imperial feet and inches (e.g. 12' 4").
   */
  static formatImperial(meters: number): string {
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
  }

  /**
   * Formats distance in meters to standard metric string (e.g. 3.76 m).
   */
  static formatMetric(meters: number): string {
    return `${(Math.round(meters * 100) / 100).toFixed(2)} m`;
  }

  /**
   * Computes Euclidean distance between two 3D spatial points.
   */
  static computeDistance(p1: ScanPoint3D, p2: ScanPoint3D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Calibrates scan metric scale using two user-selected 3D points and a known real distance.
   */
  static async calibrateWithTwoPoints(
    scanId: string,
    params: {
      point1: ScanPoint3D;
      point2: ScanPoint3D;
      knownDistanceMeters: number;
      notes?: string;
    },
    user: TokenPayload
  ): Promise<ICalibrationReference> {
    const detectedUnits = this.computeDistance(params.point1, params.point2);
    if (detectedUnits <= 0) {
      throw new Error('Reference points must be at distinct spatial coordinates');
    }
    if (params.knownDistanceMeters <= 0) {
      throw new Error('Known distance must be a positive number in meters');
    }

    return this.calibrateScan(
      scanId,
      {
        referenceDistanceMeters: params.knownDistanceMeters,
        detectedDistanceUnits: detectedUnits,
        referenceType: 'user_dimension',
        notes: params.notes || `Two-point ground truth calibration: ${params.knownDistanceMeters}m across ${detectedUnits.toFixed(3)} coordinate units`,
      },
      user
    );
  }

  /**
   * Sets or updates metric calibration reference for a scan, incrementing the calibration version.
   */
  static async calibrateScan(
    scanId: string,
    params: {
      referenceDistanceMeters: number;
      detectedDistanceUnits: number;
      referenceType: CalibrationMethod;
      notes?: string;
    },
    user: TokenPayload
  ): Promise<ICalibrationReference> {
    const scan = await ScanService.getScan(scanId, user);

    if (params.detectedDistanceUnits <= 0 || params.referenceDistanceMeters <= 0) {
      throw new Error('Distances must be strictly positive numbers for calibration');
    }

    const scaleFactor = params.referenceDistanceMeters / params.detectedDistanceUnits;
    const confidence = params.referenceType === 'known_marker' ? 0.98 : params.referenceType === 'user_dimension' ? 0.94 : 0.85;
    const toleranceCm = params.referenceType === 'known_marker' ? 1.0 : params.referenceType === 'user_dimension' ? 2.5 : 10.0;

    let calib = await CalibrationReference.findOne({ scanId: scan._id });
    if (calib) {
      calib.version = (calib.version || 1) + 1;
      calib.scaleFactor = scaleFactor;
      calib.confidence = confidence;
      calib.toleranceCm = toleranceCm;
      calib.referenceType = params.referenceType;
      calib.referenceDistanceMeters = params.referenceDistanceMeters;
      calib.detectedDistanceUnits = params.detectedDistanceUnits;
      calib.notes = params.notes;
      await calib.save();
    } else {
      calib = await CalibrationReference.create({
        scanId: scan._id,
        version: 1,
        scaleFactor,
        confidence,
        toleranceCm,
        referenceType: params.referenceType,
        referenceDistanceMeters: params.referenceDistanceMeters,
        detectedDistanceUnits: params.detectedDistanceUnits,
        measurements: [],
        notes: params.notes,
        tenantId: user.companyName || user.userId,
        createdBy: user.userId,
      });
    }

    await ScanService.logAudit(
      scan._id,
      'calibrated',
      `Metric calibration v${calib.version} set: scale factor = ${scaleFactor.toFixed(4)} (method: ${params.referenceType}, tolerance: ±${toleranceCm}cm)`,
      user,
      { scaleFactor, referenceType: params.referenceType, calibrationVersion: calib.version, toleranceCm }
    );

    return calib;
  }

  /**
   * Records a user 3D measurement with complete metadata:
   * - Geometry version
   * - Calibration version
   * - Calibration method
   * - Units
   * - Confidence or tolerance
   * - Creation source
   */
  static async addMeasurement(
    scanId: string,
    params: {
      name: string;
      startPoint: ScanPoint3D;
      endPoint: ScanPoint3D;
      roomId?: string;
      creationSource?: 'user_reference_2pt' | 'user_point_click' | 'sensor_ar' | 'manual_scale';
    },
    user: TokenPayload
  ): Promise<ScanMeasurementItem> {
    const scan = await ScanService.getScan(scanId, user);

    // Latest geometry version
    const latestArtifact = await ScanArtifact.findOne({ scanId: scan._id }).sort({ version: -1 });
    const geometryVersion = latestArtifact ? latestArtifact.version : 1;

    let calib = await CalibrationReference.findOne({ scanId: scan._id });
    const isCalibrated = !!(calib && calib.scaleFactor && calib.referenceType !== 'manual_scale');
    const scaleFactor = calib ? calib.scaleFactor : 1.0;
    const calibrationVersion = calib ? calib.version : 0;
    const calibrationMethod: CalibrationMethod = calib ? calib.referenceType : 'manual_scale';

    // If uncalibrated, confidence is lower and tolerance is wider
    const baseConfidence = isCalibrated ? (calib?.confidence || 0.90) : 0.40;
    const toleranceCm = isCalibrated ? (calib?.toleranceCm || 3.0) : 25.0;

    const rawUnits = this.computeDistance(params.startPoint, params.endPoint);
    const measuredMeters = Math.round(rawUnits * scaleFactor * 1000) / 1000;

    const measurementItem: ScanMeasurementItem = {
      id: `meas_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: params.name || 'Room Dimension',
      type: 'distance',
      startPoint: params.startPoint,
      endPoint: params.endPoint,
      measuredMeters,
      formattedImperial: this.formatImperial(measuredMeters),
      formattedMetric: this.formatMetric(measuredMeters),
      confidenceScore: baseConfidence,
      toleranceCm,
      geometryVersion,
      calibrationVersion,
      calibrationMethod,
      units: 'both',
      creationSource: params.creationSource || 'user_point_click',
      roomId: params.roomId,
      createdAt: new Date().toISOString(),
    };

    if (!calib) {
      calib = await CalibrationReference.create({
        scanId: scan._id,
        version: 1,
        scaleFactor: 1.0,
        confidence: 0.40,
        toleranceCm: 25.0,
        referenceType: 'manual_scale',
        referenceDistanceMeters: 1.0,
        detectedDistanceUnits: 1.0,
        measurements: [measurementItem],
        tenantId: user.companyName || user.userId,
        createdBy: user.userId,
      });
    } else {
      calib.measurements.push(measurementItem);
      await calib.save();
    }

    await ScanService.logAudit(
      scan._id,
      'measurement_added',
      `3D measurement "${measurementItem.name}": ${measurementItem.formattedMetric} (±${toleranceCm}cm, geom: v${geometryVersion}, calib: v${calibrationVersion})`,
      user,
      {
        measurementId: measurementItem.id,
        measuredMeters,
        geometryVersion,
        calibrationVersion,
        toleranceCm,
      }
    );

    return measurementItem;
  }
}
