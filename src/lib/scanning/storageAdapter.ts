import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/db';
import { SystemConfig } from '@/models/SystemConfig';
import { createClient } from '@supabase/supabase-js';

/**
 * ScanStorageAdapter
 *
 * NOTE ON DEPLOYMENT:
 * Local disk storage ('storage/scans') is explicitly designated for DEVELOPMENT ONLY.
 * Production environments must use durable, redundant object storage (e.g. Supabase Storage,
 * AWS S3, or Google Cloud Storage) with private access policies.
 */
export class ScanStorageAdapter {
  private static localBaseDir = path.resolve(process.cwd(), 'storage/scans');
  private static signingSecret = process.env.STORAGE_SIGNING_SECRET || 'antigravity_storage_hmac_secret_key_2026';

  /**
   * Validates storage key to block directory traversal attacks (e.g. '../', '..\\').
   */
  public static assertSafeKey(storageKey: string): string {
    if (!storageKey || typeof storageKey !== 'string') {
      throw new Error('Invalid storage key: key must be a non-empty string');
    }

    // Disallow path traversal patterns
    if (storageKey.includes('..') || storageKey.startsWith('/') || storageKey.startsWith('\\')) {
      const err = new Error(`Security Violation: Path traversal blocked in key: "${storageKey}"`);
      (err as any).status = 400;
      throw err;
    }

    const resolved = path.resolve(this.localBaseDir, storageKey);
    if (!resolved.startsWith(this.localBaseDir)) {
      const err = new Error(`Security Violation: Resolved path is outside storage root`);
      (err as any).status = 400;
      throw err;
    }

    return resolved;
  }

  /**
   * Sniffs MIME type from magic bytes to prevent MIME spoofing.
   */
  public static sniffMimeType(buffer: Buffer, declaredMime?: string): string {
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }
    if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
    if (buffer.length >= 4 && buffer[0] === 0x67 && buffer[1] === 0x6c && buffer[2] === 0x54 && buffer[3] === 0x46) {
      return 'model/gltf-binary';
    }
    if (buffer.length >= 3 && buffer.toString('ascii', 0, 3) === 'ply') {
      return 'application/x-ply';
    }
    if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return 'application/zip';
    }
    const snippet = buffer.slice(0, 100).toString('utf8').trim();
    if (snippet.startsWith('<svg') || snippet.includes('<svg')) {
      return 'image/svg+xml';
    }
    if (snippet.startsWith('{') || snippet.startsWith('[')) {
      return 'application/json';
    }

    return declaredMime || 'application/octet-stream';
  }

  /**
   * Generates a tamper-evident, time-limited signed URL token for secure artifact streaming.
   */
  public static generateSignedToken(
    storageKey: string,
    tenantId: string,
    expiresInSeconds: number = 3600
  ): { token: string; expires: number } {
    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${storageKey}:${tenantId}:${expires}`;
    const token = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    return { token, expires };
  }

  /**
   * Verifies that a signed URL token is authentic, non-expired, and tenant-matched.
   */
  public static verifySignedToken(
    storageKey: string,
    tenantId: string,
    expires: number,
    token: string
  ): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (expires < now) {
      return false; // Token expired
    }
    const payload = `${storageKey}:${tenantId}:${expires}`;
    const expected = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  }

  /**
   * Retrieves active storage configuration from database or env.
   */
  public static async getStorageConfig() {
    try {
      await connectToDatabase();
      const config = await SystemConfig.findOne().select('storageProvider supabaseConfig').lean();

      const provider = (config as any)?.storageProvider || 'local';
      const supabaseUrl = (config as any)?.supabaseConfig?.url || process.env.SUPABASE_URL || '';
      const anonKey = (config as any)?.supabaseConfig?.anonKey || process.env.SUPABASE_ANON_KEY || '';
      const serviceKey =
        (config as any)?.supabaseConfig?.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const bucket = (config as any)?.supabaseConfig?.bucket || 'real-estate-assets';

      return { provider, supabaseUrl, anonKey, serviceKey, bucket };
    } catch {
      return {
        provider: 'local',
        supabaseUrl: process.env.SUPABASE_URL || '',
        anonKey: process.env.SUPABASE_ANON_KEY || '',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        bucket: 'real-estate-assets',
      };
    }
  }

  /**
   * Saves a binary chunk or file to secure storage (Supabase or local private storage).
   */
  static async saveFile(
    storageKey: string,
    buffer: Buffer,
    contentType?: string
  ): Promise<{ storageKey: string; sizeBytes: number; sha256: string; detectedMime: string }> {
    const targetPath = this.assertSafeKey(storageKey);
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const detectedMime = this.sniffMimeType(buffer, contentType);

    const { provider, supabaseUrl, serviceKey, bucket } = await this.getStorageConfig();

    if (provider === 'supabase' && supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { error } = await supabase.storage
          .from(bucket)
          .upload(storageKey, buffer, { contentType: detectedMime, upsert: true });

        if (!error) {
          return { storageKey, sizeBytes: buffer.length, sha256, detectedMime };
        }
        console.warn('Supabase storage upload failed, falling back to secure local storage:', error.message);
      } catch (err: any) {
        console.warn('Supabase connection error, falling back to local storage:', err.message);
      }
    }

    // Secure local fallback
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(targetPath, buffer);
    return { storageKey, sizeBytes: buffer.length, sha256, detectedMime };
  }

  /**
   * Reads a file buffer from storage with path traversal protection.
   */
  static async readFile(storageKey: string): Promise<Buffer | null> {
    const targetPath = this.assertSafeKey(storageKey);
    const { provider, supabaseUrl, serviceKey, bucket } = await this.getStorageConfig();

    if (provider === 'supabase' && supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data, error } = await supabase.storage.from(bucket).download(storageKey);
        if (!error && data) {
          const arrayBuffer = await data.arrayBuffer();
          return Buffer.from(arrayBuffer);
        }
      } catch (err: any) {
        console.warn('Supabase download error, checking local storage:', err.message);
      }
    }

    if (fs.existsSync(targetPath)) {
      return fs.readFileSync(targetPath);
    }

    return null;
  }

  /**
   * Deletes a single file from storage (both Supabase cloud and local fallback).
   */
  static async deleteFile(storageKey: string): Promise<void> {
    const targetPath = this.assertSafeKey(storageKey);
    const { provider, supabaseUrl, serviceKey, bucket } = await this.getStorageConfig();

    if (provider === 'supabase' && supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.storage.from(bucket).remove([storageKey]);
      } catch (err: any) {
        console.warn('Failed to delete file from Supabase storage:', err.message);
      }
    }

    if (fs.existsSync(targetPath)) {
      try {
        fs.unlinkSync(targetPath);
      } catch {}
    }
  }

  /**
   * Recursively deletes an entire directory tree from Supabase cloud and local disk.
   */
  static async deleteDirectory(storagePrefix: string): Promise<void> {
    const targetDir = this.assertSafeKey(storagePrefix);
    const { provider, supabaseUrl, serviceKey, bucket } = await this.getStorageConfig();

    if (provider === 'supabase' && supabaseUrl && serviceKey) {
      try {
        const supabase = createClient(supabaseUrl, serviceKey);
        // List all files in the directory prefix
        const { data: files } = await supabase.storage.from(bucket).list(storagePrefix, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        });

        if (files && files.length > 0) {
          const fileKeys = files.map((f) => `${storagePrefix}/${f.name}`);
          await supabase.storage.from(bucket).remove(fileKeys);
        }
      } catch (err: any) {
        console.warn('Failed to clean Supabase directory prefix:', err.message);
      }
    }

    if (!fs.existsSync(targetDir)) return;

    const rmDirRecursive = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            rmDirRecursive(fullPath);
          } else {
            try {
              fs.chmodSync(fullPath, 0o666);
              fs.unlinkSync(fullPath);
            } catch {}
          }
        }
        fs.rmdirSync(dir);
      } catch {}
    };

    try {
      fs.rmSync(targetDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      rmDirRecursive(targetDir);
    }
  }
}
