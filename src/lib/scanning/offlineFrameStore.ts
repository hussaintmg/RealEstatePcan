/**
 * Offline Frame Store backed by IndexedDB.
 * Provides resilient client-side caching of captured scan frames and metadata.
 */

export interface CachedScanFrame {
  scanId: string;
  roomId?: string;
  frameIndex: number;
  timestamp: number;
  blob: Blob;
  mimeType: string;
  blurScore: number;
  brightnessScore: number;
  overlapScore: number;
  motionVelocity: number;
  poseQuaternion: [number, number, number, number];
  isUploaded: boolean;
}

const DB_NAME = 'RealEstate_ScanCache_v1';
const DB_VERSION = 1;
const STORE_FRAMES = 'frames';
const STORE_SESSIONS = 'sessions';

export class OfflineFrameStore {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  static async getDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB is not supported or accessible in this environment');
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_FRAMES)) {
            const store = db.createObjectStore(STORE_FRAMES, { keyPath: ['scanId', 'frameIndex'] });
            store.createIndex('scanId', 'scanId', { unique: false });
            store.createIndex('isUploaded', 'isUploaded', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
            db.createObjectStore(STORE_SESSIONS, { keyPath: 'scanId' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  static async storeFrame(frame: CachedScanFrame): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FRAMES], 'readwrite');
      const store = tx.objectStore(STORE_FRAMES);
      const req = store.put(frame);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  static async getPendingFrames(scanId: string): Promise<CachedScanFrame[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FRAMES], 'readonly');
      const store = tx.objectStore(STORE_FRAMES);
      const index = store.index('scanId');
      const req = index.getAll(scanId);

      req.onsuccess = () => {
        const allFrames: CachedScanFrame[] = req.result || [];
        resolve(allFrames.filter((f) => !f.isUploaded).sort((a, b) => a.frameIndex - b.frameIndex));
      };
      req.onerror = () => reject(req.error);
    });
  }

  static async getAllFrames(scanId: string): Promise<CachedScanFrame[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FRAMES], 'readonly');
      const store = tx.objectStore(STORE_FRAMES);
      const index = store.index('scanId');
      const req = index.getAll(scanId);

      req.onsuccess = () => {
        const allFrames: CachedScanFrame[] = req.result || [];
        resolve(allFrames.sort((a, b) => a.frameIndex - b.frameIndex));
      };
      req.onerror = () => reject(req.error);
    });
  }

  static async markUploaded(scanId: string, frameIndex: number): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FRAMES], 'readwrite');
      const store = tx.objectStore(STORE_FRAMES);
      const getReq = store.get([scanId, frameIndex]);

      getReq.onsuccess = () => {
        const item: CachedScanFrame = getReq.result;
        if (item) {
          item.isUploaded = true;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  static async clearScan(scanId: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_FRAMES], 'readwrite');
      const store = tx.objectStore(STORE_FRAMES);
      const index = store.index('scanId');
      const req = index.openCursor(scanId);

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      req.onerror = () => reject(req.error);
    });
  }
}
