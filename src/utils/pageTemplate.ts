import { makeId } from './id';
import { canvasWidthFor, panelWidthOf } from './spread';
import type { CanvasObject, Page } from '../types';

// A page template file: the whole layout of one page (background, panels, every object and its settings)
// without any pictures — uploaded screenshots, logos/pictures and image backgrounds are left out.

const FORMAT = 'screenshot-builder-page-template';

export type PageTemplateFile = {
  format: typeof FORMAT;
  version: 1;
  page: Pick<Page, 'label' | 'spread' | 'canvas' | 'objects'> & { panelWidth: number };
};

export function exportPageTemplate(page: Page): PageTemplateFile {
  const objects: CanvasObject[] = [];
  for (const o of page.objects) {
    if (o.type === 'image') continue;
    const copy = structuredClone(o);
    if (copy.type === 'phone') {
      delete copy.image;
      delete copy.imageFileName;
      copy.extraThemes?.forEach((t) => {
        delete t.image;
        delete t.imageFileName;
      });
    }
    objects.push(copy);
  }
  const background = page.canvas.background.type === 'image' ? { type: 'solid' as const, color: '#000000' } : page.canvas.background;
  return {
    format: FORMAT,
    version: 1,
    page: {
      label: page.label,
      spread: page.spread,
      canvas: { ...structuredClone(page.canvas), background: structuredClone(background) },
      objects,
      panelWidth: panelWidthOf(page),
    },
  };
}

export function downloadPageTemplate(page: Page) {
  const blob = new Blob([JSON.stringify(exportPageTemplate(page), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(page.label || 'page').replace(/[\\/:*?"<>|]+/g, '_')}.template.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Parses a template file; returns null when it is not a valid page template. */
export function parsePageTemplate(text: string): PageTemplateFile | null {
  try {
    const data = JSON.parse(text);
    const p = data?.page;
    if (data?.format !== FORMAT || !p || !Array.isArray(p.objects) || !p.canvas?.background) return null;
    if (!(p.canvas.width > 0) || !(p.canvas.height > 0) || !(p.panelWidth > 0)) return null;
    return data as PageTemplateFile;
  } catch {
    return null;
  }
}

const SCALED_KEYS = ['x', 'y', 'width', 'height', 'top', 'left', 'fontSize', 'cornerRadius', 'dividerWidth'] as const;

/** Replaces the page's layout with a template, scaling it to the page's current size. Fresh ids; pictures kept out. */
export function applyPageTemplateTo(page: Page, file: PageTemplateFile) {
  const src = file.page;
  const targetPanel = panelWidthOf(page);
  const f = targetPanel / src.panelWidth;
  // Same-size pages copy exactly; otherwise scale uniformly and centre the layout vertically on the new canvas.
  const dy = (page.canvas.height - src.canvas.height * f) / 2;
  const scale = (n: number) => Math.round(n * f);

  page.spread = src.spread;
  page.templateId = undefined;
  page.canvas.width = canvasWidthFor(targetPanel, src.spread ?? 1);
  page.canvas.background = structuredClone(src.canvas.background);
  page.objects = src.objects.map((o) => {
    const copy = structuredClone(o) as CanvasObject & Record<string, unknown>;
    copy.id = makeId();
    if (f !== 1 || dy !== 0) {
      for (const k of SCALED_KEYS) if (typeof copy[k] === 'number') copy[k] = scale(copy[k] as number);
      const yKey = 'top' in copy ? 'top' : 'y';
      if (typeof copy[yKey] === 'number') copy[yKey] = Math.round((copy[yKey] as number) + dy);
    }
    return copy as CanvasObject;
  });
}
