import type { TKey, Vars } from '../i18n';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 20 * 1024 * 1024; // 20MB

/** Errors carry a translation key + params so the UI can localize them. */
export type ImageUploadResult =
  | { ok: true; dataUrl: string }
  | { ok: false; errorKey: TKey; errorVars?: Vars };

export function readImageFile(file: File): Promise<ImageUploadResult> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return Promise.resolve({ ok: false, errorKey: 'upload.errType', errorVars: { type: file.type || 'unknown' } });
  }
  if (file.size > MAX_BYTES) {
    return Promise.resolve({ ok: false, errorKey: 'upload.errSize', errorVars: { size: (file.size / 1024 / 1024).toFixed(1) } });
  }
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ ok: true, dataUrl: reader.result as string });
    reader.onerror = () => resolve({ ok: false, errorKey: 'upload.errRead' });
    reader.readAsDataURL(file);
  });
}
