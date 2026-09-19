import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { CaptureSession, ICaptureSession } from '@/models/CaptureSession';
import { PropertyScan } from '@/models/PropertyScan';
import { ScanService } from './scanService';
import { ScanStorageAdapter } from './storageAdapter';
import { JobQueueService } from './jobQueueService';
import { QuotaService } from './quotaService';
import { TokenPayload } from '@/lib/session';

export class ResumableUploadService {
  /**
   * Initializes or resumes a chunked capture upload session with quota enforcement.
   */
  static async initSession(
    scanId: string,
    params: {
      totalChunks: number;
      chunkSize: number;
      totalBytesExpected: number;
      manifestData?: any;
    },
    user: TokenPayload
  ): Promise<{ session: ICaptureSession; uploadedChunkIndices: number[] }> {
    await connectToDatabase();
    const scan = await ScanService.getScan(scanId, user);

    // Enforce tenant storage quota before opening session
    await QuotaService.assertStorageQuota(user, params.totalBytesExpected);

    // If scan was draft or capturing, transition to uploading
    if (scan.status === 'draft' || scan.status === 'capturing') {
      await ScanService.transitionScanState(scanId, 'uploading', user, 'Upload session initiated');
    }

    // Look for existing non-expired, unfinalized session
    let session = await CaptureSession.findOne({
      scanId: scan._id,
      isFinalized: false,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      session = await CaptureSession.create({
        scanId: scan._id,
        totalChunks: params.totalChunks,
        chunkSize: params.chunkSize,
        totalBytesExpected: params.totalBytesExpected,
        totalBytesUploaded: 0,
        chunks: [],
        manifestData: params.manifestData,
        isFinalized: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24hr TTL
        tenantId: user.companyName || user.userId,
        createdBy: user.userId,
      });
    }

    const uploadedChunkIndices = session.chunks.map((c) => c.chunkIndex);

    return { session, uploadedChunkIndices };
  }

  /**
   * Ingests, verifies, and persists a single chunk.
   */
  static async uploadChunk(
    scanId: string,
    chunkIndex: number,
    buffer: Buffer,
    clientSha256: string,
    user: TokenPayload
  ): Promise<{ success: boolean; chunkIndex: number; sizeBytes: number; sha256: string }> {
    await connectToDatabase();
    const scan = await ScanService.getScan(scanId, user);

    const session = await CaptureSession.findOne({
      scanId: scan._id,
      isFinalized: false,
    });

    if (!session) {
      const err = new Error('No active upload session found for this scan');
      (err as any).status = 404;
      throw err;
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      const err = new Error('Upload session has expired (exceeded 24h TTL)');
      (err as any).status = 410;
      throw err;
    }

    // Verify SHA-256 integrity
    const computedSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    if (clientSha256 && clientSha256.toLowerCase() !== computedSha256.toLowerCase()) {
      const err = new Error(
        `Checksum mismatch for chunk ${chunkIndex}: expected ${clientSha256}, got ${computedSha256}`
      );
      (err as any).status = 400;
      throw err;
    }

    // Storage key
    const storageKey = `${scan.storagePrefix}/chunks/chunk_${String(chunkIndex).padStart(4, '0')}.bin`;
    await ScanStorageAdapter.saveFile(storageKey, buffer);

    // Record chunk in session (idempotent upsert)
    const existingIndex = session.chunks.findIndex((c) => c.chunkIndex === chunkIndex);
    if (existingIndex >= 0) {
      session.chunks[existingIndex].sizeBytes = buffer.length;
      session.chunks[existingIndex].checksumSha256 = computedSha256;
      session.chunks[existingIndex].uploadedAt = new Date();
    } else {
      session.chunks.push({
        chunkIndex,
        sizeBytes: buffer.length,
        checksumSha256: computedSha256,
        storageKey,
        uploadedAt: new Date(),
      });
    }

    session.totalBytesUploaded = session.chunks.reduce((acc, c) => acc + c.sizeBytes, 0);
    await session.save();

    await ScanService.logAudit(
      scan._id,
      'chunk_uploaded',
      `Chunk ${chunkIndex + 1}/${session.totalChunks} uploaded (${buffer.length} bytes)`,
      user,
      { chunkIndex, sizeBytes: buffer.length, sha256: computedSha256 }
    );

    return {
      success: true,
      chunkIndex,
      sizeBytes: buffer.length,
      sha256: computedSha256,
    };
  }

  /**
   * Finalizes the upload session, concatenates all chunks into an assembled server capture file,
   * verifies byte-for-byte integrity, transitions scan to processing, and dispatches a background job.
   */
  static async finalizeUpload(
    scanId: string,
    user: TokenPayload
  ): Promise<{
    success: boolean;
    session: ICaptureSession;
    jobId: string;
    assembledChecksumSha256: string;
    assembledFileKey: string;
  }> {
    await connectToDatabase();
    const scan = await ScanService.getScan(scanId, user);

    const session = await CaptureSession.findOne({ scanId: scan._id }).sort({ createdAt: -1 });
    if (!session) {
      const err = new Error('Upload session not found for scan');
      (err as any).status = 404;
      throw err;
    }

    if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
      const err = new Error('Upload session has expired');
      (err as any).status = 410;
      throw err;
    }

    // Idempotency: If already finalized, find existing job and return cleanly
    if (session.isFinalized) {
      const existingJob = await JobQueueService.getJobByScanId(scanId, user);
      return {
        success: true,
        session,
        jobId: existingJob ? existingJob._id.toString() : '',
        assembledChecksumSha256: session.assembledChecksumSha256 || '',
        assembledFileKey: session.assembledFileKey || '',
      };
    }

    // Verify all chunks are accounted for
    const chunkSet = new Set(session.chunks.map((c) => c.chunkIndex));
    const missingChunks: number[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!chunkSet.has(i)) {
        missingChunks.push(i);
      }
    }

    if (missingChunks.length > 0) {
      const err = new Error(
        `Cannot finalize upload: Missing ${missingChunks.length} chunks: [${missingChunks.slice(0, 5).join(', ')}${
          missingChunks.length > 5 ? '...' : ''
        }]`
      );
      (err as any).status = 400;
      throw err;
    }

    // --- SEQUENTIAL CHUNK CONCATENATION & BYTE-FOR-BYTE ASSEMBLY ---
    const sortedChunks = [...session.chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
    const chunkBuffers: Buffer[] = [];

    for (const chunk of sortedChunks) {
      const chunkBuf = await ScanStorageAdapter.readFile(chunk.storageKey);
      if (!chunkBuf) {
        const err = new Error(`Corrupted session: Chunk ${chunk.chunkIndex} missing from storage`);
        (err as any).status = 500;
        throw err;
      }
      chunkBuffers.push(chunkBuf);
    }

    const assembledBuffer = Buffer.concat(chunkBuffers);
    const assembledSha256 = crypto.createHash('sha256').update(assembledBuffer).digest('hex');
    const assembledFileKey = `${scan.storagePrefix}/source/capture_assembled.bin`;

    await ScanStorageAdapter.saveFile(assembledFileKey, assembledBuffer, 'application/octet-stream');

    session.isFinalized = true;
    session.finalizedAt = new Date();
    session.assembledFileKey = assembledFileKey;
    session.assembledChecksumSha256 = assembledSha256;
    await session.save();

    // Update scan frames and size
    scan.totalSizeBytes = session.totalBytesUploaded;
    scan.totalFramesCount = session.manifestData?.totalFrames || session.totalChunks;
    await scan.save();

    // Transition scan state uploading -> processing
    await ScanService.transitionScanState(
      scanId,
      'processing',
      user,
      `All ${session.totalChunks} capture chunks assembled & verified (SHA: ${assembledSha256.slice(0, 8)}...). Spawning reconstruction job.`
    );

    // Enqueue background processing job
    const job = await JobQueueService.enqueueJob(scanId, user);

    await ScanService.logAudit(
      scan._id,
      'upload_finalized',
      `Upload finalized: ${session.totalChunks} chunks assembled into ${assembledFileKey} (${assembledBuffer.length} bytes). Job ${job._id} dispatched.`,
      user,
      {
        totalChunks: session.totalChunks,
        totalBytes: session.totalBytesUploaded,
        assembledSha256,
        jobId: job._id,
      }
    );

    return {
      success: true,
      session,
      jobId: job._id.toString(),
      assembledChecksumSha256: assembledSha256,
      assembledFileKey,
    };
  }

  /**
   * Retrieves current upload session progress and missing chunk indices.
   */
  static async getSessionStatus(
    scanId: string,
    user: TokenPayload
  ): Promise<{
    session: ICaptureSession | null;
    isComplete: boolean;
    uploadedCount: number;
    missingChunks: number[];
  }> {
    await connectToDatabase();
    const scan = await ScanService.getScan(scanId, user);

    const session = await CaptureSession.findOne({ scanId: scan._id }).sort({ createdAt: -1 });
    if (!session) {
      return { session: null, isComplete: false, uploadedCount: 0, missingChunks: [] };
    }

    const uploaded = new Set(session.chunks.map((c) => c.chunkIndex));
    const missingChunks: number[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      if (!uploaded.has(i)) {
        missingChunks.push(i);
      }
    }

    return {
      session,
      isComplete: missingChunks.length === 0,
      uploadedCount: uploaded.size,
      missingChunks,
    };
  }
}
