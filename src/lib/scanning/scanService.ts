import { connectToDatabase } from '@/lib/db';
import { PropertyScan, IPropertyScan } from '@/models/PropertyScan';
import { ScanRoom } from '@/models/ScanRoom';
import { CaptureSession } from '@/models/CaptureSession';
import { ProcessingJob } from '@/models/ProcessingJob';
import { ScanArtifact } from '@/models/ScanArtifact';
import { CalibrationReference } from '@/models/CalibrationReference';
import { ScanAuditEvent } from '@/models/ScanAuditEvent';
import { Property } from '@/models/Property';
import { ScanStateMachine } from './stateMachine';
import { ScanStorageAdapter } from './storageAdapter';
import { PropertyScanStatus, ScanAuditAction } from './types';
import { TokenPayload } from '@/lib/session';
import mongoose from 'mongoose';

export class ScanService {
  /**
   * Asserts that the authenticated user owns or has tenant authority over the property/scan.
   */
  static async assertAccess(
    targetCreatedBy: mongoose.Types.ObjectId | string,
    user: TokenPayload
  ): Promise<void> {
    if (user.isDeveloper || user.isOwner) {
      return; // Platform administrators retain oversight
    }
    if (targetCreatedBy.toString() !== user.userId) {
      const err = new Error('Tenant Access Denied: Unauthorized access to scan resource');
      (err as any).status = 403;
      throw err;
    }
  }

  /**
   * Logs a tamper-evident audit event for the scan.
   */
  static async logAudit(
    scanId: string | mongoose.Types.ObjectId,
    action: ScanAuditAction,
    details: string,
    user: TokenPayload,
    metadata?: Record<string, any>
  ): Promise<void> {
    await connectToDatabase();
    await ScanAuditEvent.create({
      scanId,
      action,
      details,
      metadata,
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
    });
  }

  /**
   * Creates a new property scan aggregate.
   */
  static async createScan(
    propertyId: string,
    title: string,
    user: TokenPayload,
    deviceInfo?: any
  ): Promise<IPropertyScan> {
    await connectToDatabase();

    const property = await Property.findById(propertyId);
    if (!property) {
      const err = new Error('Property not found');
      (err as any).status = 404;
      throw err;
    }

    // Verify property ownership
    await this.assertAccess(property.createdBy, user);

    const storagePrefix = `scans/${propertyId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const scan = await PropertyScan.create({
      propertyId,
      title: title || 'Indoor Spatial Scan',
      status: 'draft',
      currentStage: 'queued',
      storageBucket: 'real-estate-assets',
      storagePrefix,
      deviceInfo: deviceInfo || {},
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      startedAt: new Date(),
    });

    await this.logAudit(scan._id, 'scan_created', `Scan initialized for property ${property.title}`, user, {
      propertyId,
      title: scan.title,
    });

    return scan;
  }

  /**
   * Retrieves a scan by ID with security checks.
   */
  static async getScan(scanId: string, user: TokenPayload): Promise<IPropertyScan> {
    await connectToDatabase();

    const scan = await PropertyScan.findById(scanId);
    if (!scan) {
      const err = new Error('Property scan not found');
      (err as any).status = 404;
      throw err;
    }

    await this.assertAccess(scan.createdBy, user);
    return scan;
  }

  /**
   * Lists all scans belonging to a given property.
   */
  static async listScansForProperty(propertyId: string, user: TokenPayload): Promise<IPropertyScan[]> {
    await connectToDatabase();

    const property = await Property.findById(propertyId);
    if (!property) {
      const err = new Error('Property not found');
      (err as any).status = 404;
      throw err;
    }

    await this.assertAccess(property.createdBy, user);

    return PropertyScan.find({ propertyId }).sort({ createdAt: -1 });
  }

  /**
   * Updates scan status according to legal state transitions.
   */
  static async transitionScanState(
    scanId: string,
    nextStatus: PropertyScanStatus,
    user: TokenPayload,
    auditDetails?: string
  ): Promise<IPropertyScan> {
    await connectToDatabase();

    const scan = await this.getScan(scanId, user);
    ScanStateMachine.assertScanTransition(scan.status, nextStatus);

    scan.status = nextStatus;
    if (nextStatus === 'ready') {
      scan.completedAt = new Date();
    }
    await scan.save();

    await this.logAudit(
      scan._id,
      nextStatus === 'ready'
        ? 'processing_completed'
        : nextStatus === 'capturing'
        ? 'capture_started'
        : 'stage_completed',
      auditDetails || `Scan transitioned from ${scan.status} to ${nextStatus}`,
      user,
      { nextStatus }
    );

    return scan;
  }

  /**
   * Deletes a scan and cleanly purges associated rooms, artifacts, sessions, and jobs.
   */
  static async deleteScan(scanId: string, user: TokenPayload): Promise<void> {
    await connectToDatabase();

    const scan = await this.getScan(scanId, user);

    await Promise.all([
      ScanRoom.deleteMany({ scanId: scan._id }),
      CaptureSession.deleteMany({ scanId: scan._id }),
      ProcessingJob.deleteMany({ scanId: scan._id }),
      ScanArtifact.deleteMany({ scanId: scan._id }),
      CalibrationReference.deleteMany({ scanId: scan._id }),
    ]);

    // Physically purge storage directory (chunks, media, 3D artifacts, floor plans)
    if (scan.storagePrefix) {
      await ScanStorageAdapter.deleteDirectory(scan.storagePrefix);
    }

    await this.logAudit(scan._id, 'scan_deleted', `Scan and all associated artifacts purged`, user);

    await PropertyScan.findByIdAndDelete(scan._id);
  }
}
