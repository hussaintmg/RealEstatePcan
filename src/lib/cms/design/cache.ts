let cachedPublicDesign: any = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory fallback

export function getCachedPublicDesign() {
  const now = Date.now();
  if (cachedPublicDesign && now - lastCacheTimestamp < CACHE_TTL_MS) {
    return cachedPublicDesign;
  }
  return null;
}

export function setCachedPublicDesign(data: any) {
  cachedPublicDesign = data;
  lastCacheTimestamp = Date.now();
}

export function clearPublicDesignCache() {
  cachedPublicDesign = null;
  lastCacheTimestamp = 0;
}
