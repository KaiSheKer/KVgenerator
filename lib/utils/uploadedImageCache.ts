'use client';

const UPLOADED_IMAGE_CACHE_KEY = 'kv_uploaded_image_cache_v1';
const WINDOW_CACHE_KEY = '__KV_UPLOADED_IMAGE_CACHE__';

interface UploadedImageCachePayload {
  id: string;
  preview: string;
  url: string;
  savedAt: number;
}

type WindowWithCache = Window & {
  [WINDOW_CACHE_KEY]?: UploadedImageCachePayload;
};

function inferMimeTypeFromDataUrl(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  return match?.[1] || 'image/jpeg';
}

export function persistUploadedImageCache(input: {
  id: string;
  preview: string;
  url: string;
}) {
  if (typeof window === 'undefined') return;
  const payload: UploadedImageCachePayload = {
    id: input.id,
    preview: input.preview,
    url: input.url,
    savedAt: Date.now(),
  };

  // Always keep an in-memory fallback to avoid storage quota issues.
  (window as WindowWithCache)[WINDOW_CACHE_KEY] = payload;
}

export function readUploadedImageCache(): UploadedImageCachePayload | null {
  if (typeof window === 'undefined') return null;

  const windowCache = (window as WindowWithCache)[WINDOW_CACHE_KEY];
  if (windowCache && typeof windowCache.preview === 'string' && windowCache.preview) {
    return windowCache;
  }

  // Read-only legacy fallback for older sessions written before this change.
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(UPLOADED_IMAGE_CACHE_KEY);
  } catch (error) {
    console.warn('[uploaded-image-cache] sessionStorage read skipped:', error);
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<UploadedImageCachePayload>;
    if (
      !parsed ||
      typeof parsed.id !== 'string' ||
      typeof parsed.preview !== 'string' ||
      typeof parsed.url !== 'string'
    ) {
      return null;
    }
    return {
      id: parsed.id,
      preview: parsed.preview,
      url: parsed.url,
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearUploadedImageCache() {
  if (typeof window === 'undefined') return;
  (window as WindowWithCache)[WINDOW_CACHE_KEY] = undefined;
  // Best-effort clear for legacy key.
  try {
    sessionStorage.removeItem(UPLOADED_IMAGE_CACHE_KEY);
  } catch (error) {
    console.warn('[uploaded-image-cache] sessionStorage clear skipped:', error);
  }
}

export function restoreUploadedImageFromCache() {
  const cached = readUploadedImageCache();
  if (!cached) return null;
  const mimeType = inferMimeTypeFromDataUrl(cached.preview);
  const restoredFile = new File([], `restored-upload.${mimeType.split('/')[1] || 'jpg'}`, {
    type: mimeType,
  });
  return {
    id: cached.id,
    file: restoredFile,
    preview: cached.preview,
    url: cached.url,
  };
}
