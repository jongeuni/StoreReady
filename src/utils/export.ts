import type Konva from 'konva';

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

export function exportPageAsPng(stage: Konva.Stage, pageLabel: string) {
  const dataUrl = exportStageToDataUrl(stage);
  downloadDataUrl(dataUrl, `${sanitizeFileName(pageLabel)}.png`);
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
  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, zipFileName);
}
