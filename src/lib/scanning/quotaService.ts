import { connectToDatabase } from '@/lib/db';
import { PropertyScan } from '@/models/PropertyScan';
import { ProcessingJob } from '@/models/ProcessingJob';
import { TokenPayload } from '@/lib/session';

export class QuotaService {
  public static readonly DEFAULT_MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB
  public static readonly DEFAULT_MAX_CONCURRENT_JOBS = 2;

  /**
   * Evaluates tenant storage usage against allocated quota.
   */
  static async assertStorageQuota(user: TokenPayload, incomingBytes: number = 0): Promise<void> {
    if (user.isDeveloper || user.isOwner) {
      return; // Platform administrators not constrained by tenant storage quota
    }

    await connectToDatabase();
    const tenantId = user.companyName || user.userId;

    const scans = await PropertyScan.find({
      $or: [{ tenantId }, { createdBy: user.userId }],
    }).select('totalSizeBytes');

    const currentUsage = scans.reduce((acc, s) => acc + (s.totalSizeBytes || 0), 0);
    const maxStorage = parseInt(process.env.SCAN_MAX_STORAGE_MB_PER_TENANT || '5120', 10) * 1024 * 1024;

    if (currentUsage + incomingBytes > maxStorage) {
      const err = new Error(
        `Tenant storage quota exceeded: Current usage ${(currentUsage / (1024 * 1024)).toFixed(
          1
        )}MB, limit ${(maxStorage / (1024 * 1024)).toFixed(1)}MB`
      );
      (err as any).status = 429;
      throw err;
    }
  }

  /**
   * Evaluates active reconstruction jobs against concurrent processing quota.
   */
  static async assertConcurrencyQuota(user: TokenPayload): Promise<void> {
    if (user.isDeveloper || user.isOwner) {
      return;
    }

    await connectToDatabase();
    const tenantId = user.companyName || user.userId;

    const activeJobsCount = await ProcessingJob.countDocuments({
      $or: [{ tenantId }, { createdBy: user.userId }],
      status: { $in: ['queued', 'processing'] },
    });

    const maxConcurrent = parseInt(process.env.SCAN_MAX_CONCURRENT_JOBS || '2', 10);

    if (activeJobsCount >= maxConcurrent) {
      const err = new Error(
        `Tenant processing concurrency quota reached: ${activeJobsCount} active reconstruction jobs in flight (Max: ${maxConcurrent})`
      );
      (err as any).status = 429;
      throw err;
    }
  }

  /**
   * Sniffs magic bytes to ensure file is legitimate image/binary data, blocking executable scripts.
   */
  static validateMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime?: string } {
    if (buffer.length < 4) {
      return { isValid: false };
    }

    // Check for malicious executable / script headers
    const textStart = buffer.slice(0, 100).toString('utf8').toLowerCase();
    if (
      textStart.includes('<?php') ||
      textStart.includes('<script') ||
      textStart.includes('#!/bin/') ||
      textStart.includes('eval(')
    ) {
      return { isValid: false };
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { isValid: true, detectedMime: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { isValid: true, detectedMime: 'image/png' };
    }

    // WebP: RIFF ... WEBP
    if (
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return { isValid: true, detectedMime: 'image/webp' };
    }

    // GLB: 67 6C 54 46 (glTF)
    if (buffer[0] === 0x67 && buffer[1] === 0x6c && buffer[2] === 0x54 && buffer[3] === 0x46) {
      return { isValid: true, detectedMime: 'model/gltf-binary' };
    }

    // PLY: 70 6C 79 0A
    if (buffer[0] === 0x70 && buffer[1] === 0x6c && buffer[2] === 0x79) {
      return { isValid: true, detectedMime: 'application/x-ply' };
    }

    // Generic binary chunk stream
    return { isValid: true, detectedMime: 'application/octet-stream' };
  }
}
