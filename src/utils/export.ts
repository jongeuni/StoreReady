import type Konva from 'konva';
import type { Page } from '../types';
import { DEVICE_MODELS } from '../phoneFrame';

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '_').toLowerCase();
}

export function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports a Konva stage to a full-resolution PNG data URL.
 * The stage may be visually scaled down for the editor viewport (stage.scaleX/scaleY < 1);
 * pixelRatio compensates so the exported raster always matches the page's real canvas
 * pixel dimensions, regardless of viewport zoom.
 */
export function exportStageToDataUrl(stage: Konva.Stage): string {
  const scale = stage.scaleX() || 1;
  return stage.toDataURL({ mimeType: 'image/png', pixelRatio: 1 / scale });
}

/** Cuts a wide image into `parts` equal images of exactly `partWidth` × `height` px (a multi-panel spread). */
export async function sliceDataUrl(dataUrl: string, parts: number, partWidth: number, height: number, gap = 0): Promise<string[]> {
  if (parts <= 1) return [dataUrl];
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not read the exported image'));
    img.src = dataUrl;
  });
  const out: string[] = [];
  for (let i = 0; i < parts; i++) {
    const canvas = document.createElement('canvas');
    canvas.width = partWidth;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');
    // The editor gap between panels is skipped, so each slice is exactly one panel.
    ctx.drawImage(img, i * (partWidth + gap), 0, partWidth, img.naturalHeight, 0, 0, partWidth, height);
    out.push(canvas.toDataURL('image/png'));
  }
  return out;
}

export async function exportPageAsPng(stage: Konva.Stage, pageLabel: string, spread = 1, panel?: { width: number; height: number; gap: number }) {
  const dataUrl = exportStageToDataUrl(stage);
  const base = sanitizeFileName(pageLabel);
  if (spread <= 1 || !panel) {
    downloadDataUrl(dataUrl, `${base}.png`);
    return;
  }
  const slices = await sliceDataUrl(dataUrl, spread, panel.width, panel.height, panel.gap);
  slices.forEach((url, i) => downloadDataUrl(url, `${base}_${i + 1}.png`));
}

export async function exportPagesAsZip(
  entries: { label: string; dataUrl: string }[],
  zipFileName: string,
) {
  const JSZip = (await import('jszip')).default;
  const { saveAs } = await import('file-saver');
  const zip = new JSZip();
  entries.forEach((entry, i) => {
    const base64 = entry.dataUrl.split(',')[1];
    zip.file(`${String(i + 1).padStart(2, '0')}-${sanitizeFileName(entry.label)}.png`, base64, { base64: true });
  });
  // PNGs are already compressed; storing them as-is is much faster and uses far less memory than DEFLATE.
  const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE', streamFiles: true });
  saveAs(blob, zipFileName);
}

/** Decodes every picture the pages use (screenshots, free images, 3D phone frames) so exports never catch one half-loaded. */
export async function preloadProjectImages(pages: Page[]): Promise<void> {
  const urls = new Set<string>(DEVICE_MODELS.flatMap((m) => (m.render3d ? [m.render3d.frameUrl] : [])));
  for (const page of pages) {
    for (const obj of page.objects) {
      if (obj.type === 'phone') {
        if (obj.image) urls.add(obj.image);
        for (const th of obj.extraThemes ?? []) if (th.image) urls.add(th.image);
      } else if (obj.type === 'image' && obj.image) {
        urls.add(obj.image);
      }
    }
  }
  await Promise.all(
    [...urls].map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // a broken image shouldn't block the whole export
          img.src = src;
        }),
    ),
  );
}
