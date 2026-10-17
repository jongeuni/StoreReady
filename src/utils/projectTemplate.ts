import { makeId } from './id';
import type { CanvasObject, Page, Project } from '../types';

// A project template file: everything about the open version (name, screenshot size, every page with its
// background, panels, texts, devices and all their settings) without any pictures — uploaded screenshots,
// free pictures/logos and image backgrounds are left out.

const FORMAT = 'screenshot-builder-project-template';

export type ProjectTemplateFile = {
  format: typeof FORMAT;
  version: 1;
  project: Pick<Project, 'name' | 'devicePresetId' | 'pages'>;
};

function stripPage(page: Page): Page {
  const copy = structuredClone(page);
  copy.objects = copy.objects.filter((o) => o.type !== 'image');
  for (const o of copy.objects) {
    if (o.type !== 'phone') continue;
    delete o.image;
    delete o.imageFileName;
    o.extraThemes?.forEach((t) => {
      delete t.image;
      delete t.imageFileName;
    });
  }
  if (copy.canvas.background.type === 'image') copy.canvas.background = { type: 'solid', color: '#000000' };
  return copy;
}

export function exportProjectTemplate(project: Project): ProjectTemplateFile {
  return {
    format: FORMAT,
    version: 1,
    project: { name: project.name, devicePresetId: project.devicePresetId, pages: project.pages.map(stripPage) },
  };
}

export function downloadProjectTemplate(project: Project) {
  const blob = new Blob([JSON.stringify(exportProjectTemplate(project), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(project.name || 'project').replace(/[\\/:*?"<>|]+/g, '_')}.template.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Parses a template file; returns null when it is not a valid project template. */
export function parseProjectTemplate(text: string): ProjectTemplateFile | null {
  try {
    const data = JSON.parse(text);
    const p = data?.project;
    if (data?.format !== FORMAT || !p || typeof p.devicePresetId !== 'string' || !Array.isArray(p.pages) || p.pages.length === 0) return null;
    const ok = p.pages.every(
      (pg: Page) => pg && pg.canvas?.background && pg.canvas.width > 0 && pg.canvas.height > 0 && Array.isArray(pg.objects),
    );
    return ok ? (data as ProjectTemplateFile) : null;
  } catch {
    return null;
  }
}

/** The template's pages with fresh ids, ready to put into a project. */
export function pagesFromTemplate(file: ProjectTemplateFile): Page[] {
  return file.project.pages.map((page) => ({
    ...structuredClone(page),
    id: makeId(),
    objects: page.objects.map((o) => ({ ...structuredClone(o), id: makeId() }) as CanvasObject),
  }));
}
