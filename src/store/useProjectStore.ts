import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { current } from 'immer';
import { makeId } from '../utils/id';
import { translate, useI18n } from '../i18n';
import { idbStorage } from '../persist/idbStorage';
import { DEFAULT_DEVICE_PRESET_ID, getDevicePreset } from '../devicePresets';
import { canvasWidthFor, panelWidthOf } from '../utils/spread';
import { pagesFromTemplate, type ProjectTemplateFile } from '../utils/projectTemplate';
import { createBlankPage, layoutPageWithTemplate, type TemplateId } from '../templates';
import { getObjectBBox, unionBBox, computeAlignedPosition, setObjectPosition, type AlignType } from '../utils/geometry';
import { DEVICE_DEFAULT_WIDTH_RATIO, defaultModelForPreset, getDeviceModel } from '../phoneFrame';
import type {
  Background,
  CanvasObject,
  DeviceKind,
  DevicePreset,
  Page,
  PhoneObject,
  Project,
  ShapeKind,
  ShapeObject,
  ImageObject,
  TextObject,
  TextRole,
} from '../types';

/**
 * When a page's screenshot size targets a different device (phone -> iPad / Watch) or orientation,
 * swap its device mockups for the matching kind and refit them so they stay inside the canvas.
 * Spread pages and pages already using the right kind are left alone.
 */
function fitDevicesToPreset(page: Page, preset: DevicePreset) {
  if ((page.spread ?? 1) > 1) return;
  const landscape = preset.width > preset.height;
  const target = defaultModelForPreset(preset.kind, landscape);
  for (const obj of page.objects) {
    if (obj.type !== 'phone') continue;
    const current = getDeviceModel(obj.deviceModel, obj.deviceKind ?? 'phone');
    const kindOk = (obj.deviceKind ?? 'phone') === preset.kind;
    const orientationOk = preset.kind === 'phone' ? true : preset.kind === 'watch' ? true : current.aspect < 1 === landscape;
    if (!preset.creative && !(kindOk && orientationOk)) {
      obj.deviceKind = preset.kind;
      obj.deviceModel = target.id;
      const maxWidth = page.canvas.width * (preset.kind === 'watch' ? 0.7 : 0.86);
      const top = Math.min(obj.top, Math.round(page.canvas.height * 0.4));
      const availableHeight = page.canvas.height - top - page.canvas.height * 0.04;
      obj.width = Math.max(40, Math.round(Math.min(maxWidth, availableHeight / target.aspect)));
      obj.top = top;
      obj.left = Math.round((page.canvas.width - obj.width) / 2);
      obj.rotation = 0;
    }

    // Whatever the preset, never leave a device bigger than the page (a wide banner would otherwise
    // inherit a phone scaled up by the width ratio).
    const model = getDeviceModel(obj.deviceModel, obj.deviceKind ?? 'phone');
    const maxH = page.canvas.height * 0.94;
    const maxW = page.canvas.width * 0.96;
    let width = obj.width;
    if (width * model.aspect > maxH) width = Math.floor(maxH / model.aspect);
    if (width > maxW) width = Math.floor(maxW);
    if (width !== obj.width) {
      const cx = obj.left + obj.width / 2;
      obj.width = Math.max(40, width);
      obj.left = Math.round(Math.min(Math.max(cx - obj.width / 2, 0), page.canvas.width - obj.width));
    }
    const h = obj.width * model.aspect;
    if (obj.top + h > page.canvas.height) obj.top = Math.max(0, Math.round(page.canvas.height - h));
  }
}

/** Most versions (copies of a project) the editor keeps at once; each copy carries its own images. */
export const MAX_VERSIONS = 20;

/** A deep copy of a project with fresh ids everywhere, so it can live next to the original. */
function cloneProjectWithNewIds(project: Project): Project {
  const copy = structuredClone(project);
  copy.id = makeId();
  for (const page of copy.pages) {
    page.id = makeId();
    for (const obj of page.objects) obj.id = makeId();
  }
  return copy;
}

function uniqueVersionName(base: string, taken: string[]): string {
  const root = base.trim() || 'Untitled Project';
  if (!taken.includes(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root} ${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

function nextPageLabel(pages: Page[]): string {
  return `Page ${pages.filter((p) => !p.isCommon).length + 1}`;
}

/** Properties of the Common page's objects that are shared with (and editable on) the Common page. */
const COMMON_TEXT_KEYS = ['x', 'y', 'width', 'fontSize'] as const;
const COMMON_PHONE_KEYS = ['left', 'top', 'width', 'rotation'] as const;

/** Builds the Common page: background + a headline, a subtitle and one empty phone (text is fixed, not editable). */
function buildCommonPage(preset: DevicePreset): Page {
  const lang = useI18n.getState().lang;
  const page = createBlankPage('Common', preset.width, preset.height);
  layoutPageWithTemplate(page, preset.creative ? 'creative-banner' : 'single-phone', preset.width, preset.height);
  fitDevicesToPreset(page, preset);
  page.templateId = undefined;
  page.isCommon = true;
  const first = (pred: (o: CanvasObject) => boolean) => page.objects.find(pred);
  const head = first((o) => o.type === 'text' && o.role === 'headline');
  const sub = first((o) => o.type === 'text' && o.role === 'subheadline');
  const phone = first((o) => o.type === 'phone');
  if (head?.type === 'text') head.text = translate(lang, 'commonPage.headline');
  if (sub?.type === 'text') sub.text = translate(lang, 'commonPage.subtitle');
  page.objects = [head, sub, phone].filter((o): o is CanvasObject => !!o);
  return page;
}

/** The project with its Common page in front (added when a saved project predates it). */
function withCommonPage(project: Project): Project {
  if (project.pages.some((p) => p.isCommon)) {
    const at = project.pages.findIndex((p) => p.isCommon);
    if (at === 0) return project;
    const pages = [...project.pages];
    const [common] = pages.splice(at, 1);
    return { ...project, pages: [common, ...pages] };
  }
  return { ...project, pages: [buildCommonPage(getDevicePreset(project.devicePresetId)), ...project.pages] };
}

function firstTextOf(page: Page, role: TextRole): TextObject | undefined {
  return page.objects.find((o): o is TextObject => o.type === 'text' && o.role === role);
}

/** Pushes the Common page's background and headline/subtitle position+size onto every other page. */
function syncFromCommon(project: Project) {
  const common = project.pages.find((p) => p.isCommon);
  if (!common) return;
  const head = firstTextOf(common, 'headline');
  const sub = firstTextOf(common, 'subheadline');
  for (const page of project.pages) {
    if (page.isCommon) continue;
    page.canvas.background = structuredClone(current(common).canvas.background);
    if ((page.spread ?? 1) > 1) continue;
    for (const [src, role] of [[head, 'headline'], [sub, 'subheadline']] as const) {
      const target = firstTextOf(page, role);
      if (!src || !target) continue;
      for (const k of COMMON_TEXT_KEYS) target[k] = src[k];
    }
  }
}

/** Makes a freshly built page start from the Common page (background, headline/subtitle, a lone phone's place). */
function inheritFromCommon(page: Page, project: Project, preset: DevicePreset) {
  const common = project.pages.find((p) => p.isCommon);
  if (!common) return;
  page.canvas.background = structuredClone(current(common).canvas.background);
  if (preset.creative || (page.spread ?? 1) > 1) return;
  for (const role of ['headline', 'subheadline'] as const) {
    const src = firstTextOf(common, role);
    const target = firstTextOf(page, role);
    if (src && target) for (const k of COMMON_TEXT_KEYS) target[k] = src[k];
  }
  const srcPhone = common.objects.find((o) => o.type === 'phone');
  const phones = page.objects.filter((o) => o.type === 'phone');
  if (srcPhone?.type === 'phone' && phones.length === 1 && phones[0].type === 'phone') {
    for (const k of COMMON_PHONE_KEYS) (phones[0] as PhoneObject)[k] = srcPhone[k];
  }
}


function createInitialProject(): Project {
  const preset = getDevicePreset(DEFAULT_DEVICE_PRESET_ID);
  return {
    id: makeId(),
    name: 'Untitled Project',
    devicePresetId: preset.id,
    pages: [buildCommonPage(preset), createBlankPage('Page 1', preset.width, preset.height)],
  };
}

/** A project that is saved but not currently open in the editor. */
type ParkedProject = { project: Project; currentPageId: string };

type State = {
  project: Project;
  currentPageId: string;
  /** Every version's id, in display order (the open one included). */
  versionIds: string[];
  /** The versions that are not open right now, by id. */
  parked: Record<string, ParkedProject>;
  selectedObjectIds: string[];
};

type Actions = {
  // Project / device
  renameProject: (name: string) => void;
  setDevicePreset: (id: string) => void;

  // Versions: whole-project copies (e.g. one per language) that can be switched between and exported together
  duplicateProject: () => void;
  /** Replaces the open version's name, screenshot size and pages with an imported template file (no pictures). */
  importProjectTemplate: (file: ProjectTemplateFile) => void;
  switchProject: (projectId: string) => void;
  removeProject: (projectId: string) => void;

  // Pages
  addPage: (templateId?: TemplateId) => void;
  removePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, label: string) => void;
  movePage: (pageId: string, direction: -1 | 1) => void;
  /** Moves a page to an absolute position (0-based index in the final order). */
  reorderPage: (pageId: string, toIndex: number) => void;
  applyTemplate: (pageId: string, templateId: TemplateId) => void;
  setBackground: (pageId: string, background: Background) => void;

  // Objects
  addTextObject: (pageId: string, role: TextRole) => void;
  addPhoneObject: (pageId: string, deviceKind?: DeviceKind) => void;
  addShapeObject: (pageId: string, shapeKind: ShapeKind) => void;
  addImageObject: (pageId: string, dataUrl: string, fileName: string, naturalWidth: number, naturalHeight: number) => void;
  /** Puts a screenshot into a phone: fills the first empty screen, otherwise adds another diagonal band. */
  addScreenshotToPhone: (pageId: string, objectId: string, dataUrl: string, fileName: string) => void;
  updateObject: (pageId: string, objectId: string, patch: Partial<CanvasObject>) => void;
  moveObjectBy: (pageId: string, objectId: string, dx: number, dy: number) => void;
  removeObject: (pageId: string, objectId: string) => void;
  removeSelectedObjects: (pageId: string) => void;
  duplicateObject: (pageId: string, objectId: string) => void;
  setScreenshotImage: (pageId: string, objectId: string, dataUrl: string, fileName: string) => void;
  clearScreenshotImage: (pageId: string, objectId: string) => void;

  // Layers
  bringForward: (pageId: string, objectId: string) => void;
  sendBackward: (pageId: string, objectId: string) => void;
  bringToFront: (pageId: string, objectId: string) => void;
  sendToBack: (pageId: string, objectId: string) => void;

  // Alignment
  alignSelected: (pageId: string, align: AlignType) => void;

  // Selection
  setSelectedObjectIds: (ids: string[]) => void;
  selectObject: (id: string, additive?: boolean) => void;
  clearSelection: () => void;

  // Danger zone
  resetProject: () => void;
};

const initialProject = createInitialProject();

type PersistedState = {
  project: Project;
  currentPageId: string;
  versionIds?: string[];
  parked?: Record<string, ParkedProject>;
};

export const useProjectStore = create<State & Actions>()(
  persist<State & Actions, [], [['zustand/immer', never]], PersistedState>(
    immer((set) => ({
      project: initialProject,
      currentPageId: initialProject.pages[1].id,
      versionIds: [initialProject.id],
      parked: {},
      selectedObjectIds: [],

      renameProject: (name) =>
        set((s) => {
          s.project.name = name;
        }),

      setDevicePreset: (id) =>
        set((s) => {
          const preset = getDevicePreset(id);
          const prevPreset = getDevicePreset(s.project.devicePresetId);
          const scaleX = preset.width / prevPreset.width;
          const scaleY = preset.height / prevPreset.height;
          // Text follows the canvas as a whole, not just its width: when the shape changes (portrait -> landscape,
          // phone -> watch) scaling by width alone makes headlines overflow the shorter side.
          const textScale = Math.min(Math.sqrt(scaleX * scaleY), Math.min(scaleX, scaleY) * 1.3);
          s.project.devicePresetId = id;
          for (const page of s.project.pages) {
            page.canvas.width = canvasWidthFor(preset.width, page.spread ?? 1);
            page.canvas.height = preset.height;
            for (const obj of page.objects) {
              if (obj.type === 'phone') {
                obj.left = Math.round(obj.left * scaleX);
                obj.top = Math.round(obj.top * scaleY);
                obj.width = Math.round(obj.width * scaleX);
              } else if (obj.type === 'image') {
                // A picture's own aspect ratio must survive a canvas reshape (portrait <-> landscape,
                // phone <-> iPad): scale both sides by the same factor instead of stretching it.
                obj.left = Math.round(obj.left * scaleX);
                obj.top = Math.round(obj.top * scaleY);
                obj.width = Math.round(obj.width * textScale);
                obj.height = Math.round(obj.height * textScale);
              } else if (obj.type === 'shape') {
                obj.left = Math.round(obj.left * scaleX);
                obj.top = Math.round(obj.top * scaleY);
                obj.width = Math.round(obj.width * scaleX);
                obj.height = Math.round(obj.height * scaleY);
              } else {
                obj.x = Math.round(obj.x * scaleX);
                obj.y = Math.round(obj.y * scaleY);
                obj.width = Math.round(obj.width * scaleX);
                obj.fontSize = Math.max(6, Math.round(obj.fontSize * textScale));
              }
            }
            fitDevicesToPreset(page, preset);
          }
        }),

      duplicateProject: () =>
        set((s) => {
          if (s.versionIds.length >= MAX_VERSIONS) return;
          const source = current(s.project);
          const names = [source.name, ...Object.values(s.parked).map((v) => v.project.name)];
          const copy = cloneProjectWithNewIds(source);
          copy.name = uniqueVersionName(`${source.name || 'Untitled Project'} copy`, names);
          // The copy opens right away (ready to be renamed and translated); the original is parked beside it.
          s.parked[source.id] = { project: source, currentPageId: s.currentPageId };
          const at = s.versionIds.indexOf(source.id);
          s.versionIds.splice(at + 1, 0, copy.id);
          s.project = copy;
          s.currentPageId = copy.pages[0].id;
          s.selectedObjectIds = [];
        }),

      importProjectTemplate: (file) =>
        set((s) => {
          const preset = getDevicePreset(file.project.devicePresetId);
          const pages = withCommonPage({ ...s.project, devicePresetId: preset.id, pages: pagesFromTemplate(file) }).pages;
          s.project.name = file.project.name;
          s.project.devicePresetId = getDevicePreset(file.project.devicePresetId).id;
          s.project.pages = pages;
          s.currentPageId = (pages.find((p) => !p.isCommon) ?? pages[0]).id;
          s.selectedObjectIds = [];
        }),

      switchProject: (projectId) =>
        set((s) => {
          if (projectId === s.project.id) return;
          const target = s.parked[projectId];
          if (!target) return;
          s.parked[s.project.id] = { project: current(s.project), currentPageId: s.currentPageId };
          s.project = target.project;
          s.currentPageId = target.project.pages.some((pg) => pg.id === target.currentPageId) ? target.currentPageId : target.project.pages[0].id;
          delete s.parked[projectId];
          s.selectedObjectIds = [];
        }),

      removeProject: (projectId) =>
        set((s) => {
          if (s.versionIds.length <= 1 || !s.versionIds.includes(projectId)) return;
          const at = s.versionIds.indexOf(projectId);
          if (projectId === s.project.id) {
            // Deleting the open one: the neighbouring version takes its place.
            const nextId = s.versionIds[at + 1] ?? s.versionIds[at - 1];
            const next = s.parked[nextId];
            if (!next) return;
            s.project = next.project;
            s.currentPageId = next.currentPageId;
            delete s.parked[nextId];
            s.selectedObjectIds = [];
          } else {
            delete s.parked[projectId];
          }
          s.versionIds.splice(at, 1);
        }),

      addPage: (templateId = 'single-phone') =>
        set((s) => {
          const preset = getDevicePreset(s.project.devicePresetId);
          const page = createBlankPage(nextPageLabel(s.project.pages), preset.width, preset.height);
          layoutPageWithTemplate(page, preset.creative ? 'creative-banner' : templateId, preset.width, preset.height);
          fitDevicesToPreset(page, preset);
          inheritFromCommon(page, s.project, preset);
          s.project.pages.push(page);
          s.currentPageId = page.id;
          s.selectedObjectIds = [];
        }),

      removePage: (pageId) =>
        set((s) => {
          if (s.project.pages.filter((p) => !p.isCommon).length <= 1) return;
          const idx = s.project.pages.findIndex((p) => p.id === pageId);
          if (idx === -1 || s.project.pages[idx].isCommon) return;
          s.project.pages.splice(idx, 1);
          if (s.currentPageId === pageId) {
            const nextIdx = Math.max(1, idx - 1);
            s.currentPageId = s.project.pages[nextIdx].id;
          }
          s.selectedObjectIds = [];
        }),

      duplicatePage: (pageId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const clone: Page = {
            ...page,
            id: makeId(),
            label: `${page.label} copy`,
            objects: page.objects.map((o) => ({ ...o, id: makeId() })),
          };
          const idx = s.project.pages.findIndex((p) => p.id === pageId);
          s.project.pages.splice(idx + 1, 0, clone);
          s.currentPageId = clone.id;
          s.selectedObjectIds = [];
        }),

      selectPage: (pageId) =>
        set((s) => {
          s.currentPageId = pageId;
          s.selectedObjectIds = [];
        }),

      renamePage: (pageId, label) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (page && !page.isCommon) page.label = label;
        }),

      reorderPage: (pageId, toIndex) =>
        set((s) => {
          const from = s.project.pages.findIndex((p) => p.id === pageId);
          const to = Math.max(1, Math.min(s.project.pages.length - 1, toIndex));
          if (from === -1 || from === to || s.project.pages[from].isCommon) return;
          const [page] = s.project.pages.splice(from, 1);
          s.project.pages.splice(to, 0, page);
        }),

      movePage: (pageId, direction) =>
        set((s) => {
          const idx = s.project.pages.findIndex((p) => p.id === pageId);
          const newIdx = idx + direction;
          if (idx === -1 || newIdx < 1 || newIdx >= s.project.pages.length || s.project.pages[idx].isCommon) return;
          const [page] = s.project.pages.splice(idx, 1);
          s.project.pages.splice(newIdx, 0, page);
        }),

      applyTemplate: (pageId, templateId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const panelWidth = panelWidthOf(page);
          layoutPageWithTemplate(page, templateId, panelWidth, page.canvas.height);
          fitDevicesToPreset(page, getDevicePreset(s.project.devicePresetId));
          s.selectedObjectIds = [];
        }),

      setBackground: (pageId, background) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          page.canvas.background = background;
          if (page.isCommon) syncFromCommon(s.project);
        }),

      addTextObject: (pageId, role) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          const width = Math.round(page.canvas.width * 0.7);
          const defaults: Record<TextRole, Partial<TextObject>> = {
            headline: { fontSize: Math.round(page.canvas.width * 0.079), fontWeight: 700, color: '#ffffff' },
            subheadline: { fontSize: Math.round(page.canvas.width * 0.031), fontWeight: 400, color: '#c9c9cc' },
            body: { fontSize: Math.round(page.canvas.width * 0.026), fontWeight: 400, color: '#c9c9cc' },
          };
          const obj: TextObject = {
            id: makeId(),
            type: 'text',
            role,
            text: role === 'headline' ? 'New headline' : role === 'subheadline' ? 'New subheadline' : 'New text',
            x: Math.round((page.canvas.width - width) / 2),
            y: Math.round(page.canvas.height * 0.08),
            width,
            fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
            align: 'center',
            lineHeight: 1.2,
            rotation: 0,
            zIndex: maxZ + 1,
            ...defaults[role],
          } as TextObject;
          page.objects.push(obj);
          s.selectedObjectIds = [obj.id];
        }),

      addPhoneObject: (pageId, deviceKind = 'phone') =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          // Pick the mockup that matches this page's orientation, and keep it inside the canvas.
          const panelWidth = panelWidthOf(page);
          const model = defaultModelForPreset(deviceKind, panelWidth > page.canvas.height);
          const top = Math.round(page.canvas.height * 0.32);
          const fitWidth = Math.floor((page.canvas.height - top - page.canvas.height * 0.04) / model.aspect);
          const width = Math.max(40, Math.min(Math.round(panelWidth * DEVICE_DEFAULT_WIDTH_RATIO[deviceKind]), fitWidth));
          const existingCount = page.objects.filter((o) => o.type === 'phone' && (o.deviceKind ?? 'phone') === deviceKind).length;
          const namePrefix = deviceKind === 'phone' ? 'screen' : deviceKind;
          const obj: PhoneObject = {
            id: makeId(),
            type: 'phone',
            deviceKind,
            deviceModel: model.id,
            screenshotName: `${namePrefix}_${existingCount + 1}`,
            width,
            left: Math.round((panelWidth - width) / 2),
            top,
            rotation: 0,
            zIndex: maxZ + 1,
          };
          page.objects.push(obj);
          s.selectedObjectIds = [obj.id];
        }),

      addShapeObject: (pageId, shapeKind) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          const size = Math.round(page.canvas.width * 0.3);
          const obj: ShapeObject = {
            id: makeId(),
            type: 'shape',
            shapeKind,
            width: size,
            height: size,
            left: Math.round((page.canvas.width - size) / 2),
            top: Math.round((page.canvas.height - size) / 2),
            fill: '#000000',
            cornerRadius: shapeKind === 'rect' ? Math.round(size * 0.06) : undefined,
            rotation: 0,
            zIndex: maxZ + 1,
          };
          page.objects.push(obj);
          s.selectedObjectIds = [obj.id];
        }),

      addImageObject: (pageId, dataUrl, fileName, naturalWidth, naturalHeight) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon || naturalWidth <= 0 || naturalHeight <= 0) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          // Fit within 60% of the canvas width and 40% of its height, never upscaling past the file's own size.
          const scale = Math.min(1, (page.canvas.width * 0.6) / naturalWidth, (page.canvas.height * 0.4) / naturalHeight);
          const width = Math.max(40, Math.round(naturalWidth * scale));
          const height = Math.max(40, Math.round(naturalHeight * scale));
          const obj: ImageObject = {
            id: makeId(),
            type: 'image',
            image: dataUrl,
            fileName,
            width,
            height,
            left: Math.round((page.canvas.width - width) / 2),
            top: Math.round((page.canvas.height - height) / 2),
            rotation: 0,
            zIndex: maxZ + 1,
          };
          page.objects.push(obj);
          s.selectedObjectIds = [obj.id];
        }),

      addScreenshotToPhone: (pageId, objectId, dataUrl, fileName) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!obj || obj.type !== 'phone' || page?.isCommon) return;
          if (!obj.image) {
            obj.image = dataUrl;
            obj.imageFileName = fileName;
            return;
          }
          const themes = obj.extraThemes ?? [];
          const empty = themes.findIndex((th) => !th.image);
          if (empty !== -1) {
            themes[empty].image = dataUrl;
            themes[empty].imageFileName = fileName;
          } else {
            themes.push({ name: `${obj.screenshotName || 'screen'}_${themes.length + 2}`, image: dataUrl, imageFileName: fileName });
          }
          obj.extraThemes = themes;
          obj.dividerCuts = undefined;
          s.selectedObjectIds = [obj.id];
        }),

      updateObject: (pageId, objectId, patch) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!obj || !page) return;
          if (page.isCommon) {
            // The Common page only shares position/size; everything else on it is fixed.
            const allowed: readonly string[] = obj.type === 'text' ? COMMON_TEXT_KEYS : obj.type === 'phone' ? COMMON_PHONE_KEYS : [];
            for (const [k, v] of Object.entries(patch)) if (allowed.includes(k)) (obj as Record<string, unknown>)[k] = v;
            syncFromCommon(s.project);
            return;
          }
          Object.assign(obj, patch);
        }),

      moveObjectBy: (pageId, objectId, dx, dy) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!obj) return;
          if (obj.type === 'phone' || obj.type === 'shape' || obj.type === 'image') {
            obj.left += dx;
            obj.top += dy;
          } else {
            obj.x += dx;
            obj.y += dy;
          }
          if (page?.isCommon) syncFromCommon(s.project);
        }),

      removeObject: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          page.objects = page.objects.filter((o) => o.id !== objectId);
          s.selectedObjectIds = s.selectedObjectIds.filter((id) => id !== objectId);
        }),

      removeSelectedObjects: (pageId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page || page.isCommon) return;
          const selected = new Set(s.selectedObjectIds);
          page.objects = page.objects.filter((o) => !selected.has(o.id));
          s.selectedObjectIds = [];
        }),

      duplicateObject: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!page || !obj || page.isCommon) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          const clone: CanvasObject =
            obj.type === 'phone' || obj.type === 'shape' || obj.type === 'image'
              ? { ...obj, id: makeId(), left: obj.left + 24, top: obj.top + 24, zIndex: maxZ + 1 }
              : { ...obj, id: makeId(), x: obj.x + 24, y: obj.y + 24, zIndex: maxZ + 1 };
          page.objects.push(clone);
          s.selectedObjectIds = [clone.id];
        }),

      setScreenshotImage: (pageId, objectId, dataUrl, fileName) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (obj && obj.type === 'phone' && !page?.isCommon) {
            obj.image = dataUrl;
            obj.imageFileName = fileName;
          }
        }),

      clearScreenshotImage: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (obj && obj.type === 'phone') {
            delete obj.image;
            delete obj.imageFileName;
          }
        }),

      bringForward: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          const sorted = [...page.objects].sort((a, b) => a.zIndex - b.zIndex);
          const idx = sorted.findIndex((o) => o.id === objectId);
          if (idx === -1 || idx === sorted.length - 1) return;
          const a = sorted[idx];
          const b = sorted[idx + 1];
          const tmp = a.zIndex;
          a.zIndex = b.zIndex;
          b.zIndex = tmp;
        }),

      sendBackward: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          const sorted = [...page.objects].sort((a, b) => a.zIndex - b.zIndex);
          const idx = sorted.findIndex((o) => o.id === objectId);
          if (idx <= 0) return;
          const a = sorted[idx];
          const b = sorted[idx - 1];
          const tmp = a.zIndex;
          a.zIndex = b.zIndex;
          b.zIndex = tmp;
        }),

      bringToFront: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!page || !obj) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          obj.zIndex = maxZ + 1;
        }),

      sendToBack: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!page || !obj) return;
          const minZ = Math.min(0, ...page.objects.map((o) => o.zIndex));
          obj.zIndex = minZ - 1;
        }),

      alignSelected: (pageId, align) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          const targets = page.objects.filter((o) => s.selectedObjectIds.includes(o.id));
          if (targets.length === 0) return;
          const reference =
            targets.length === 1
              ? { x: 0, y: 0, width: page.canvas.width, height: page.canvas.height }
              : unionBBox(targets.map(getObjectBBox));
          for (const obj of targets) {
            const bbox = getObjectBBox(obj);
            const { x, y } = computeAlignedPosition(bbox, reference, align);
            const updated = setObjectPosition(obj, Math.round(x), Math.round(y));
            Object.assign(obj, updated);
          }
          if (page.isCommon) syncFromCommon(s.project);
        }),

      setSelectedObjectIds: (ids) =>
        set((s) => {
          s.selectedObjectIds = ids;
        }),

      selectObject: (id, additive = false) =>
        set((s) => {
          if (additive) {
            if (s.selectedObjectIds.includes(id)) {
              s.selectedObjectIds = s.selectedObjectIds.filter((x) => x !== id);
            } else {
              s.selectedObjectIds.push(id);
            }
          } else {
            s.selectedObjectIds = [id];
          }
        }),

      clearSelection: () =>
        set((s) => {
          s.selectedObjectIds = [];
        }),

      resetProject: () =>
        set((s) => {
          const fresh = createInitialProject();
          const at = s.versionIds.indexOf(s.project.id);
          if (at !== -1) s.versionIds[at] = fresh.id;
          s.project = fresh;
          s.currentPageId = fresh.pages[1].id;
          s.selectedObjectIds = [];
        }),
    })),
    {
      name: 'app-store-screenshot-builder',
      storage: {
        getItem: async (name) => {
          const value = await idbStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await idbStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await idbStorage.removeItem(name);
        },
      },
      partialize: (state) => ({
        project: state.project,
        currentPageId: state.currentPageId,
        versionIds: state.versionIds,
        parked: state.parked,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Saved data from before the Common page existed: add it in front (open project and parked versions).
        const withCommon = withCommonPage(state.project);
        if (withCommon !== state.project) useProjectStore.setState({ project: withCommon });
        if (state.parked) {
          const parked = Object.fromEntries(
            Object.entries(state.parked).map(([id, v]) => [id, { ...v, project: withCommonPage(v.project) }]),
          );
          useProjectStore.setState({ parked });
        }
        if (!withCommon.pages.find((p) => p.id === state.currentPageId)) {
          useProjectStore.setState({ currentPageId: (withCommon.pages.find((p) => !p.isCommon) ?? withCommon.pages[0]).id });
        }
        if (!state.project.pages.find((p) => p.id === state.currentPageId)) {
          state.currentPageId = state.project.pages[0]?.id ?? state.currentPageId;
        }
        // Saved data from before versions existed has no list (and the placeholder id from first load is stale):
        // rebuild it so the open project and every parked one are listed exactly once.
        const parkedIds = Object.keys(state.parked ?? {}).filter((id) => id !== state.project.id);
        const known = (state.versionIds ?? []).filter((id) => id === state.project.id || parkedIds.includes(id));
        const missing = [state.project.id, ...parkedIds].filter((id) => !known.includes(id));
        useProjectStore.setState({ versionIds: [...known, ...missing] });
      },
    },
  ),
);

export function getCurrentPage(): Page | undefined {
  const s = useProjectStore.getState();
  return s.project.pages.find((p) => p.id === s.currentPageId);
}
