import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { makeId } from '../utils/id';
import { idbStorage } from '../persist/idbStorage';
import { DEFAULT_DEVICE_PRESET_ID, getDevicePreset } from '../devicePresets';
import { canvasWidthFor, panelWidthOf } from '../utils/spread';
import { createBlankPage, layoutPageWithTemplate, type TemplateId } from '../templates';
import { getObjectBBox, unionBBox, computeAlignedPosition, setObjectPosition, type AlignType } from '../utils/geometry';
import { DEVICE_DEFAULT_WIDTH_RATIO, defaultModelForKind } from '../phoneFrame';
import type {
  Background,
  CanvasObject,
  DeviceKind,
  Page,
  PhoneObject,
  Project,
  ShapeKind,
  ShapeObject,
  ImageObject,
  TextObject,
  TextRole,
} from '../types';

function nextPageLabel(pages: Page[]): string {
  return `Page ${pages.length + 1}`;
}

function createInitialProject(): Project {
  const preset = getDevicePreset(DEFAULT_DEVICE_PRESET_ID);
  return {
    id: makeId(),
    name: 'Untitled Project',
    devicePresetId: preset.id,
    pages: [createBlankPage('Page 1', preset.width, preset.height)],
  };
}

type State = {
  project: Project;
  currentPageId: string;
  selectedObjectIds: string[];
  promptWizardOpen: boolean;
  promptWizardStep: 1 | 2 | 3;
  promptWizardSelectedPageIds: string[];
};

type Actions = {
  // Project / device
  renameProject: (name: string) => void;
  setDevicePreset: (id: string) => void;
  setExtraNotes: (notes: string) => void;

  // Pages
  addPage: (templateId?: TemplateId) => void;
  removePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, label: string) => void;
  movePage: (pageId: string, direction: -1 | 1) => void;
  applyTemplate: (pageId: string, templateId: TemplateId) => void;
  setBackground: (pageId: string, background: Background) => void;

  // Objects
  addTextObject: (pageId: string, role: TextRole) => void;
  addPhoneObject: (pageId: string, deviceKind?: DeviceKind) => void;
  addShapeObject: (pageId: string, shapeKind: ShapeKind) => void;
  addImageObject: (pageId: string, dataUrl: string, fileName: string, naturalWidth: number, naturalHeight: number) => void;
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

  // AI prompt wizard
  openPromptWizard: () => void;
  closePromptWizard: () => void;
  setPromptWizardStep: (step: 1 | 2 | 3) => void;
  togglePromptWizardPage: (pageId: string) => void;
  setPromptWizardAllPagesSelected: (selected: boolean) => void;

  // Danger zone
  resetProject: () => void;
};

const initialProject = createInitialProject();

type PersistedState = { project: Project; currentPageId: string };

export const useProjectStore = create<State & Actions>()(
  persist<State & Actions, [], [['zustand/immer', never]], PersistedState>(
    immer((set) => ({
      project: initialProject,
      currentPageId: initialProject.pages[0].id,
      selectedObjectIds: [],
      promptWizardOpen: false,
      promptWizardStep: 1,
      promptWizardSelectedPageIds: [],

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
          s.project.devicePresetId = id;
          for (const page of s.project.pages) {
            page.canvas.width = canvasWidthFor(preset.width, page.spread ?? 1);
            page.canvas.height = preset.height;
            for (const obj of page.objects) {
              if (obj.type === 'phone') {
                obj.left = Math.round(obj.left * scaleX);
                obj.top = Math.round(obj.top * scaleY);
                obj.width = Math.round(obj.width * scaleX);
              } else if (obj.type === 'shape' || obj.type === 'image') {
                obj.left = Math.round(obj.left * scaleX);
                obj.top = Math.round(obj.top * scaleY);
                obj.width = Math.round(obj.width * scaleX);
                obj.height = Math.round(obj.height * scaleY);
              } else {
                obj.x = Math.round(obj.x * scaleX);
                obj.y = Math.round(obj.y * scaleY);
                obj.width = Math.round(obj.width * scaleX);
                obj.fontSize = Math.round(obj.fontSize * scaleX);
              }
            }
          }
        }),

      setExtraNotes: (notes) =>
        set((s) => {
          s.project.extraNotes = notes;
        }),

      addPage: (templateId = 'single-phone') =>
        set((s) => {
          const preset = getDevicePreset(s.project.devicePresetId);
          const page = createBlankPage(nextPageLabel(s.project.pages), preset.width, preset.height);
          layoutPageWithTemplate(page, templateId, preset.width, preset.height);
          s.project.pages.push(page);
          s.currentPageId = page.id;
          s.selectedObjectIds = [];
        }),

      removePage: (pageId) =>
        set((s) => {
          if (s.project.pages.length <= 1) return;
          const idx = s.project.pages.findIndex((p) => p.id === pageId);
          if (idx === -1) return;
          s.project.pages.splice(idx, 1);
          if (s.currentPageId === pageId) {
            const nextIdx = Math.max(0, idx - 1);
            s.currentPageId = s.project.pages[nextIdx].id;
          }
          s.selectedObjectIds = [];
        }),

      duplicatePage: (pageId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
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
          if (page) page.label = label;
        }),

      movePage: (pageId, direction) =>
        set((s) => {
          const idx = s.project.pages.findIndex((p) => p.id === pageId);
          const newIdx = idx + direction;
          if (idx === -1 || newIdx < 0 || newIdx >= s.project.pages.length) return;
          const [page] = s.project.pages.splice(idx, 1);
          s.project.pages.splice(newIdx, 0, page);
        }),

      applyTemplate: (pageId, templateId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          const panelWidth = panelWidthOf(page);
          layoutPageWithTemplate(page, templateId, panelWidth, page.canvas.height);
          s.selectedObjectIds = [];
        }),

      setBackground: (pageId, background) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (page) page.canvas.background = background;
        }),

      addTextObject: (pageId, role) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
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
          if (!page) return;
          const maxZ = Math.max(0, ...page.objects.map((o) => o.zIndex));
          const width = Math.round(page.canvas.width * DEVICE_DEFAULT_WIDTH_RATIO[deviceKind]);
          const existingCount = page.objects.filter((o) => o.type === 'phone' && (o.deviceKind ?? 'phone') === deviceKind).length;
          const namePrefix = deviceKind === 'phone' ? 'screen' : deviceKind;
          const obj: PhoneObject = {
            id: makeId(),
            type: 'phone',
            deviceKind,
            deviceModel: defaultModelForKind(deviceKind).id,
            screenshotName: `${namePrefix}_${existingCount + 1}`,
            width,
            left: Math.round((page.canvas.width - width) / 2),
            top: Math.round(page.canvas.height * 0.32),
            rotation: 0,
            zIndex: maxZ + 1,
          };
          page.objects.push(obj);
          s.selectedObjectIds = [obj.id];
        }),

      addShapeObject: (pageId, shapeKind) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
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
          if (!page || naturalWidth <= 0 || naturalHeight <= 0) return;
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

      updateObject: (pageId, objectId, patch) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!obj) return;
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
        }),

      removeObject: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          page.objects = page.objects.filter((o) => o.id !== objectId);
          s.selectedObjectIds = s.selectedObjectIds.filter((id) => id !== objectId);
        }),

      removeSelectedObjects: (pageId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          if (!page) return;
          const selected = new Set(s.selectedObjectIds);
          page.objects = page.objects.filter((o) => !selected.has(o.id));
          s.selectedObjectIds = [];
        }),

      duplicateObject: (pageId, objectId) =>
        set((s) => {
          const page = s.project.pages.find((p) => p.id === pageId);
          const obj = page?.objects.find((o) => o.id === objectId);
          if (!page || !obj) return;
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
          if (obj && obj.type === 'phone') {
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

      openPromptWizard: () =>
        set((s) => {
          s.promptWizardOpen = true;
          s.promptWizardStep = 1;
          s.promptWizardSelectedPageIds = s.project.pages.map((p) => p.id);
        }),

      closePromptWizard: () =>
        set((s) => {
          s.promptWizardOpen = false;
        }),

      setPromptWizardStep: (step) =>
        set((s) => {
          s.promptWizardStep = step;
        }),

      togglePromptWizardPage: (pageId) =>
        set((s) => {
          if (s.promptWizardSelectedPageIds.includes(pageId)) {
            s.promptWizardSelectedPageIds = s.promptWizardSelectedPageIds.filter((id) => id !== pageId);
          } else {
            s.promptWizardSelectedPageIds.push(pageId);
          }
        }),

      setPromptWizardAllPagesSelected: (selected) =>
        set((s) => {
          s.promptWizardSelectedPageIds = selected ? s.project.pages.map((p) => p.id) : [];
        }),

      resetProject: () =>
        set((s) => {
          const fresh = createInitialProject();
          s.project = fresh;
          s.currentPageId = fresh.pages[0].id;
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
      partialize: (state) => ({ project: state.project, currentPageId: state.currentPageId }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.project.pages.find((p) => p.id === state.currentPageId)) {
          state.currentPageId = state.project.pages[0]?.id ?? state.currentPageId;
        }
      },
    },
  ),
);

export function getCurrentPage(): Page | undefined {
  const s = useProjectStore.getState();
  return s.project.pages.find((p) => p.id === s.currentPageId);
}
