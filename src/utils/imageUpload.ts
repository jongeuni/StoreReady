const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

export type ImageUploadResult = { ok: true; dataUrl: string } | { ok: false; error: string };

export function readImageFile(file: File): Promise<ImageUploadResult> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.resolve({ ok: false, error: `Unsupported file type "${file.type || 'unknown'}". Use PNG, JPEG, or WebP.` });
  }
  if (file.size > MAX_BYTES) {
    return Promise.resolve({ ok: false, error: `Image is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 20MB.` });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ ok: true, dataUrl: reader.result as string });
    reader.onerror = () => resolve({ ok: false, error: 'Could not read the image file. Please try again.' });
    reader.readAsDataURL(file);
  });
}
