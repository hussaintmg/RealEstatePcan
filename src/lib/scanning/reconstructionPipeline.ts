import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { PropertyScan } from '@/models/PropertyScan';
import { ProcessingJob } from '@/models/ProcessingJob';
import { ScanArtifact } from '@/models/ScanArtifact';
import { ScanService } from './scanService';
import { JobQueueService } from './jobQueueService';
import { ScanStorageAdapter } from './storageAdapter';
import { ArtifactType, IReconstructionProvider, ReconstructionJobPayload, JobStatusReport } from './types';
import { TokenPayload } from '@/lib/session';

export interface GeneratedArtifactResult {
  type: ArtifactType;
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
  sha256: string;
  version: number;
  isDevelopmentOnly?: boolean;
}

/**
 * DEVELOPMENT ONLY ADAPTER:
 * Generates synthetic bounding box GLB and procedural sine-wave PLY point cloud buffers.
 * IMPORTANT: This is NOT genuine photogrammetry or neural radiance field estimation.
 * It is provided solely as a development and local testing adapter.
 */
export class DevelopmentProceduralAdapter implements IReconstructionProvider {
  public readonly providerId = 'dev_procedural_adapter';
  public readonly isDevelopmentOnly = true;

  /**
   * Generates a valid, standards-compliant binary glTF 2.0 (.glb) buffer
   * containing a 3D procedural room box / mesh with materials and vertices.
   */
  static generateBinaryGlb(roomDimensions: { width: number; depth: number; height: number }): Buffer {
    const { width, depth, height } = roomDimensions;
    const halfW = width / 2;
    const halfD = depth / 2;

    const positions = new Float32Array([
      -halfW, 0, -halfD,
       halfW, 0, -halfD,
       halfW, 0,  halfD,
      -halfW, 0,  halfD,
      -halfW, height, -halfD,
       halfW, height, -halfD,
       halfW, height,  halfD,
      -halfW, height,  halfD,
    ]);

    const normals = new Float32Array([
      0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
    ]);

    const indices = new Uint16Array([
      0, 1, 2,  0, 2, 3,
      4, 6, 5,  4, 7, 6,
      3, 2, 6,  3, 6, 7,
      1, 0, 4,  1, 4, 5,
      0, 3, 7,  0, 7, 4,
      2, 1, 5,  2, 5, 6,
    ]);

    const posByteLength = positions.byteLength;
    const normByteLength = normals.byteLength;
    const idxByteLength = indices.byteLength;

    const totalBinaryBytes = posByteLength + normByteLength + idxByteLength;
    const binBuffer = Buffer.alloc(totalBinaryBytes);

    let offset = 0;
    binBuffer.set(new Uint8Array(positions.buffer), offset);
    offset += posByteLength;
    binBuffer.set(new Uint8Array(normals.buffer), offset);
    offset += normByteLength;
    binBuffer.set(new Uint8Array(indices.buffer), offset);

    const gltf = {
      asset: { version: '2.0', generator: 'Development_Procedural_Adapter_NonPhotogrammetric' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: 'DevelopmentRoomBoxMesh', mesh: 0 }],
      meshes: [
        {
          primitives: [
            {
              attributes: { POSITION: 0, NORMAL: 1 },
              indices: 2,
              mode: 4,
            },
          ],
        },
      ],
      accessors: [
        {
          bufferView: 0,
          byteOffset: 0,
          componentType: 5126,
          count: 8,
          type: 'VEC3',
          min: [-halfW, 0, -halfD],
          max: [halfW, height, halfD],
        },
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: 5126,
          count: 8,
          type: 'VEC3',
        },
        {
          bufferView: 2,
          byteOffset: 0,
          componentType: 5123,
          count: indices.length,
          type: 'SCALAR',
        },
      ],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: posByteLength, target: 34962 },
        { buffer: 0, byteOffset: posByteLength, byteLength: normByteLength, target: 34962 },
        { buffer: 0, byteOffset: posByteLength + normByteLength, byteLength: idxByteLength, target: 34963 },
      ],
      buffers: [{ byteLength: totalBinaryBytes }],
    };

    const jsonText = JSON.stringify(gltf);
    const jsonPaddedLength = Math.ceil(Buffer.byteLength(jsonText) / 4) * 4;
    const jsonBuffer = Buffer.alloc(jsonPaddedLength, 0x20);
    jsonBuffer.write(jsonText, 0, 'utf8');

    const totalGlbLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;
    const glbBuffer = Buffer.alloc(totalGlbLength);

    glbBuffer.writeUInt32LE(0x46546c67, 0);
    glbBuffer.writeUInt32LE(2, 4);
    glbBuffer.writeUInt32LE(totalGlbLength, 8);

    glbBuffer.writeUInt32LE(jsonBuffer.length, 12);
    glbBuffer.writeUInt32LE(0x4e4f534a, 16);
    jsonBuffer.copy(glbBuffer, 20);

    const binChunkOffset = 20 + jsonBuffer.length;
    glbBuffer.writeUInt32LE(binBuffer.length, binChunkOffset);
    glbBuffer.writeUInt32LE(0x004e4942, binChunkOffset + 4);
    binBuffer.copy(glbBuffer, binChunkOffset + 8);

    return glbBuffer;
  }

  /**
   * Generates a valid binary PLY point cloud buffer.
   */
  static generateBinaryPly(pointCount: number = 500): Buffer {
    const headerText = [
      'ply',
      'format binary_little_endian 1.0',
      `element vertex ${pointCount}`,
      'property float x',
      'property float y',
      'property float z',
      'property uchar red',
      'property uchar green',
      'property uchar blue',
      'end_header\n',
    ].join('\n');

    const headerBuffer = Buffer.from(headerText, 'ascii');
    const vertexBytes = 15;
    const bodyBuffer = Buffer.alloc(pointCount * vertexBytes);

    for (let i = 0; i < pointCount; i++) {
      const offset = i * vertexBytes;
      const x = (Math.sin(i * 0.3) * 2.5);
      const y = (Math.abs(Math.cos(i * 0.2)) * 2.7);
      const z = (Math.cos(i * 0.3) * 2.0);

      bodyBuffer.writeFloatLE(x, offset);
      bodyBuffer.writeFloatLE(y, offset + 4);
      bodyBuffer.writeFloatLE(z, offset + 8);

      bodyBuffer.writeUInt8(Math.floor(180 + Math.sin(i) * 50), offset + 12);
      bodyBuffer.writeUInt8(Math.floor(180 + Math.cos(i) * 50), offset + 13);
      bodyBuffer.writeUInt8(Math.floor(200), offset + 14);
    }

    return Buffer.concat([headerBuffer, bodyBuffer]);
  }

  async dispatchJob(payload: ReconstructionJobPayload): Promise<{ externalJobId: string }> {
    return { externalJobId: `dev_proc_${payload.jobId}` };
  }

  async checkJobStatus(externalJobId: string): Promise<JobStatusReport> {
    return {
      jobId: externalJobId,
      status: 'completed',
      stage: 'completed',
      progress: 100,
      stageDetails: 'Development procedural simulation completed',
    };
  }

  async cancelJob(externalJobId: string): Promise<boolean> {
    return true;
  }
}

/**
 * PRODUCTION REAL RECONSTRUCTION PROVIDER:
 * Connects to a secure external GPU reconstruction worker (COLMAP / OpenMVS / Nerfstudio / 3DGS).
 */
export class ExternalGpuWorkerProvider implements IReconstructionProvider {
  public readonly providerId = 'external_gpu_worker';
  public readonly isDevelopmentOnly = false;
  private workerEndpoint: string;
  private workerSecret: string;

  constructor(workerEndpoint?: string, workerSecret?: string) {
    this.workerEndpoint = workerEndpoint || process.env.GPU_RECONSTRUCTION_WORKER_URL || '';
    this.workerSecret = workerSecret || process.env.GPU_RECONSTRUCTION_WORKER_SECRET || 'dev_secret_key';
  }

  async dispatchJob(payload: ReconstructionJobPayload): Promise<{ externalJobId: string }> {
    if (!this.workerEndpoint) {
      throw new Error(
        'Real GPU reconstruction worker endpoint is not configured (GPU_RECONSTRUCTION_WORKER_URL missing). ' +
        'Cannot dispatch genuine photogrammetry job without GPU worker infrastructure.'
      );
    }

    const signature = crypto
      .createHmac('sha256', this.workerSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await fetch(`${this.workerEndpoint}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-worker-signature': signature,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GPU Worker dispatch failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    return { externalJobId: data.externalJobId || data.id };
  }

  async checkJobStatus(externalJobId: string): Promise<JobStatusReport> {
    if (!this.workerEndpoint) {
      throw new Error('GPU worker endpoint not configured');
    }

    const res = await fetch(`${this.workerEndpoint}/jobs/${externalJobId}`, {
      headers: {
        'Authorization': `Bearer ${this.workerSecret}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to check GPU worker job status: ${res.status}`);
    }

    return res.json();
  }

  async cancelJob(externalJobId: string): Promise<boolean> {
    if (!this.workerEndpoint) return false;

    const res = await fetch(`${this.workerEndpoint}/jobs/${externalJobId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.workerSecret}`,
      },
    });

    return res.ok;
  }
}

export class ReconstructionPipeline {
  private static defaultProvider: IReconstructionProvider = new DevelopmentProceduralAdapter();

  static setProvider(provider: IReconstructionProvider): void {
    this.defaultProvider = provider;
  }

  static getProvider(): IReconstructionProvider {
    if (process.env.GPU_RECONSTRUCTION_WORKER_URL) {
      return new ExternalGpuWorkerProvider();
    }
    return this.defaultProvider;
  }

  static generateBinaryGlb(roomDimensions: { width: number; depth: number; height: number }): Buffer {
    return DevelopmentProceduralAdapter.generateBinaryGlb(roomDimensions);
  }

  static generateBinaryPly(pointCount: number = 500): Buffer {
    return DevelopmentProceduralAdapter.generateBinaryPly(pointCount);
  }

  /**
   * Executes the reconstruction pipeline for a job.
   * If running under the DevelopmentProceduralAdapter, explicitly flags that the generated
   * geometry is procedural/synthetic for testing and NOT real reconstruction.
   */
  static async runPipeline(jobId: string, user: TokenPayload): Promise<GeneratedArtifactResult[]> {
    await connectToDatabase();
    const job = await ProcessingJob.findById(jobId);
    if (!job) throw new Error('Job not found');

    const scan = await ScanService.getScan(job.scanId.toString(), user);
    const provider = this.getProvider();

    // Determine artifact version
    const latestArtifact = await ScanArtifact.findOne({ scanId: scan._id }).sort({ version: -1 });
    const currentVersion = latestArtifact ? latestArtifact.version + 1 : 1;

    if (!provider.isDevelopmentOnly && provider instanceof ExternalGpuWorkerProvider) {
      // Dispatch to real external GPU worker
      await JobQueueService.updateJobProgress(
        job._id.toString(),
        'queued',
        10,
        'Dispatched to genuine GPU reconstruction worker'
      );

      const dispatchRes = await provider.dispatchJob({
        jobId: job._id.toString(),
        scanId: scan._id.toString(),
        tenantId: user.companyName || user.userId,
        sourceMediaStorageKey: `${scan.storagePrefix}/source/capture_assembled.bin`,
        options: {
          denseResolution: 'high',
          generateSplats: false, // splats require dedicated 3DGS pipeline
          generateMesh: true,
        },
      });

      job.workerId = `gpu_worker_${dispatchRes.externalJobId}`;
      await job.save();

      return [];
    }

    // --- DEVELOPMENT PROCEDURAL ADAPTER FLOW ---
    // Explicitly labeled as development simulation
    await JobQueueService.updateJobProgress(
      job._id.toString(),
      'validating',
      15,
      '[DEV ADAPTER] Validating media chunks and structure'
    );

    await JobQueueService.updateJobProgress(
      job._id.toString(),
      'mesh_generation',
      70,
      '[DEV ADAPTER] Generating development synthetic bounding mesh'
    );

    await JobQueueService.updateJobProgress(
      job._id.toString(),
      'floor_plan_synthesis',
      90,
      '[DEV ADAPTER] Preparing development vector representations'
    );

    const artifactsResult: GeneratedArtifactResult[] = [];

    // 1. Mesh GLB (Procedural development box)
    const glbBuffer = DevelopmentProceduralAdapter.generateBinaryGlb({ width: 5.2, depth: 4.5, height: 2.8 });
    const glbKey = `${scan.storagePrefix}/v${currentVersion}/model.glb`;
    const glbSaved = await ScanStorageAdapter.saveFile(glbKey, glbBuffer, 'model/gltf-binary');
    await ScanArtifact.create({
      scanId: scan._id,
      type: 'mesh_glb',
      version: currentVersion,
      storageKey: glbKey,
      fileSizeBytes: glbSaved.sizeBytes,
      checksumSha256: glbSaved.sha256,
      mimeType: 'model/gltf-binary',
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      metadata: { isDevelopmentProcedural: true, generator: 'DevelopmentProceduralAdapter' },
    });
    artifactsResult.push({
      type: 'mesh_glb',
      storageKey: glbKey,
      sizeBytes: glbSaved.sizeBytes,
      mimeType: 'model/gltf-binary',
      sha256: glbSaved.sha256,
      version: currentVersion,
      isDevelopmentOnly: true,
    });

    // 2. Point Cloud PLY (Development synthetic point cloud)
    const plyBuffer = DevelopmentProceduralAdapter.generateBinaryPly(500);
    const plyKey = `${scan.storagePrefix}/v${currentVersion}/pointcloud.ply`;
    const plySaved = await ScanStorageAdapter.saveFile(plyKey, plyBuffer, 'application/x-ply');
    await ScanArtifact.create({
      scanId: scan._id,
      type: 'pointcloud_ply',
      version: currentVersion,
      storageKey: plyKey,
      fileSizeBytes: plySaved.sizeBytes,
      checksumSha256: plySaved.sha256,
      mimeType: 'application/x-ply',
      tenantId: user.companyName || user.userId,
      createdBy: user.userId,
      metadata: { isDevelopmentProcedural: true, generator: 'DevelopmentProceduralAdapter' },
    });
    artifactsResult.push({
      type: 'pointcloud_ply',
      storageKey: plyKey,
      sizeBytes: plySaved.sizeBytes,
      mimeType: 'application/x-ply',
      sha256: plySaved.sha256,
      version: currentVersion,
      isDevelopmentOnly: true,
    });

    // Mark job completed with honest development adapter notation
    await JobQueueService.completeJob(job._id.toString());

    await ScanService.logAudit(
      scan._id,
      'processing_completed',
      `Development procedural pipeline v${currentVersion} completed (synthetic GLB/PLY generated for UI testing)`,
      user,
      { version: currentVersion, artifactsCount: artifactsResult.length, isDevelopmentOnly: true }
    );

    return artifactsResult;
  }
}
