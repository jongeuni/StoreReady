import { nanoid } from 'nanoid';
import type { CanvasObject, Page, Background } from './types';
import { canvasWidthFor, spreadGap } from './utils/spread';

export type TemplateId = 'single-phone' | 'dual-phone' | 'split-phone' | 'split-phone-3d' | 'diagonal-split' | 'phone-3d' | 'blank';

export type Template = {
  id: TemplateId;
  label: string;
  description: string;
  /** Export panels side by side on one page (default 1). `build` gets the width of a single panel. */
  spread?: number;
  build: (canvasWidth: number, canvasHeight: number) => CanvasObject[];
};

const DEFAULT_BACKGROUND: Background = { type: 'solid', color: '#000000' };

function headlineObject(canvasWidth: number, canvasHeight: number, text: string): CanvasObject {
  const width = Math.round(canvasWidth * 0.86);
  return {
    id: nanoid(),
    type: 'text',
    role: 'headline',
    text,
    x: Math.round((canvasWidth - width) / 2),
    y: Math.round(canvasHeight * 0.09),
    width,
    fontSize: Math.round(canvasWidth * 0.079),
    fontFamily: 'system-ui, -apple-system, "SF Pro Display", sans-serif',
    fontWeight: 700,
    color: '#ffffff',
    align: 'center',
    lineHeight: 1.08,
    rotation: 0,
    zIndex: 10,
  };
}

function subheadlineObject(canvasWidth: number, canvasHeight: number, text: string): CanvasObject {
  const width = Math.round(canvasWidth * 0.78);
  return {
    id: nanoid(),
    type: 'text',
    role: 'subheadline',
    text,
    x: Math.round((canvasWidth - width) / 2),
    y: Math.round(canvasHeight * 0.225),
    width,
    fontSize: Math.round(canvasWidth * 0.031),
    fontFamily: 'system-ui, -apple-system, "SF Pro Text", sans-serif',
    fontWeight: 400,
    color: '#c9c9cc',
    align: 'center',
    lineHeight: 1.35,
    rotation: 0,
    zIndex: 10,
  };
}

/**
 * Two export panels side by side with one big phone straddling the seam. Exported as two separate images
 * that, laid next to each other (or swiped in the App Store), read as a single phone.
 * `panelWidth` is the width of ONE panel; the objects live on a canvas of 2 × panelWidth.
 */
function buildSplitPhone(panelWidth: number, canvasHeight: number, model3d = false): CanvasObject[] {
  // The baked 3D phone image has empty margins around the device, so its frame is drawn wider.
  const phoneWidth = Math.round(panelWidth * (model3d ? 1.05 : 0.8));
  const headline = headlineObject(panelWidth, canvasHeight, 'One screen,\ntwo pages');
  const sub = subheadlineObject(panelWidth, canvasHeight, 'A single phone that flows across two screenshots.');
  for (const o of [headline, sub]) {
    if (o.type === 'text') {
      o.x = Math.round(panelWidth * 0.06);
      o.width = Math.round(panelWidth * 0.56);
      o.align = 'left';
    }
  }
  return [
    headline,
    sub,
    {
      id: nanoid(),
      type: 'phone',
      ...(model3d ? { deviceKind: 'phone' as const, deviceModel: 'phone-3d' } : {}),
      screenshotName: 'screen_1',
      width: phoneWidth,
      top: Math.round(canvasHeight * (model3d ? 0.27 : 0.3)),
      left: Math.round(panelWidth + spreadGap(panelWidth) / 2 - phoneWidth / 2),
      rotation: 0,
      zIndex: 1,
    },
  ];
}

export const TEMPLATES: Template[] = [
  {
    id: 'blank',
    label: 'Blank',
    description: 'Empty canvas — start from scratch',
    build: () => [],
  },
  {
    id: 'single-phone',
    label: 'Single Phone',
    description: 'Headline, subheadline, and one phone',
    build: (canvasWidth, canvasHeight) => {
      const phoneWidth = Math.round(canvasWidth * 0.62);
      return [
        headlineObject(canvasWidth, canvasHeight, 'Your headline\ngoes here'),
        subheadlineObject(canvasWidth, canvasHeight, 'A short supporting line that explains the value of this screen.'),
        {
          id: nanoid(),
          type: 'phone',
          screenshotName: 'screen_1',
          width: phoneWidth,
          top: Math.round(canvasHeight * 0.35),
          left: Math.round((canvasWidth - phoneWidth) / 2),
          rotation: 0,
          zIndex: 1,
        },
      ];
    },
  },
  {
    id: 'split-phone',
    label: 'Split Phone',
    description: 'Two screenshots side by side with one big phone across the seam',
    spread: 2,
    build: (w, h) => buildSplitPhone(w, h),
  },
  {
    id: 'split-phone-3d',
    label: 'Split 3D Phone',
    description: 'Two screenshots side by side with one big tilted 3D phone across the seam',
    spread: 2,
    build: (w, h) => buildSplitPhone(w, h, true),
  },
  {
    id: 'phone-3d',
    label: '3D Phone',
    description: 'Headline, subheadline, and one tilted 3D phone',
    build: (canvasWidth, canvasHeight) => {
      const phoneWidth = Math.round(canvasWidth * 0.92);
      return [
        headlineObject(canvasWidth, canvasHeight, 'Your headline\ngoes here'),
        subheadlineObject(canvasWidth, canvasHeight, 'A short supporting line that explains the value of this screen.'),
        {
          id: nanoid(),
          type: 'phone',
          deviceKind: 'phone',
          deviceModel: 'phone-3d',
          screenshotName: 'screen_1',
          width: phoneWidth,
          top: Math.round(canvasHeight * 0.31),
          left: Math.round((canvasWidth - phoneWidth) / 2),
          rotation: 0,
          zIndex: 1,
        },
      ];
    },
  },
  {
    id: 'diagonal-split',
    label: 'Diagonal Split',
    description: 'Headline, subheadline, and one phone whose screen is split diagonally between three themes',
    build: (canvasWidth, canvasHeight) => {
      const phoneWidth = Math.round(canvasWidth * 0.62);
      return [
        headlineObject(canvasWidth, canvasHeight, 'Your app,\nyour theme'),
        subheadlineObject(canvasWidth, canvasHeight, 'Show several looks of the same screen in one phone.'),
        {
          id: nanoid(),
          type: 'phone',
          screenshotName: 'theme_1',
          extraThemes: [{ name: 'theme_2' }, { name: 'theme_3' }],
          width: phoneWidth,
          top: Math.round(canvasHeight * 0.35),
          left: Math.round((canvasWidth - phoneWidth) / 2),
          rotation: 0,
          zIndex: 1,
        },
      ];
    },
  },
  {
    id: 'dual-phone',
    label: 'Dual Phone',
    description: 'Headline, subheadline, and two overlapping phones',
    build: (canvasWidth, canvasHeight) => {
      const phoneWidth = Math.round(canvasWidth * 0.515);
      const top1 = Math.round(canvasHeight * 0.385);
      const top2 = Math.round(canvasHeight * 0.345);
      const left1 = Math.round(canvasWidth * 0.03);
      const left2 = Math.round(canvasWidth * 0.455);
      return [
        headlineObject(canvasWidth, canvasHeight, 'Two screens,\none story'),
        subheadlineObject(canvasWidth, canvasHeight, 'Show how two parts of your app work together.'),
        {
          id: nanoid(),
          type: 'phone',
          screenshotName: 'screen_1',
          width: phoneWidth,
          top: top1,
          left: left1,
          rotation: -6,
          zIndex: 1,
        },
        {
          id: nanoid(),
          type: 'phone',
          screenshotName: 'screen_2',
          width: phoneWidth,
          top: top2,
          left: left2,
          rotation: 5,
          zIndex: 2,
        },
      ];
    },
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function createBlankPage(label: string, canvasWidth: number, canvasHeight: number): Page {
  return {
    id: nanoid(),
    label,
    templateId: 'single-phone',
    canvas: {
      width: canvasWidth,
      height: canvasHeight,
      background: { ...DEFAULT_BACKGROUND },
    },
    objects: getTemplate('single-phone')!.build(canvasWidth, canvasHeight),
  };
}

/** Fills `page` with a template's objects, sizing its canvas to the template's panel count. */
export function layoutPageWithTemplate(page: Page, templateId: string, panelWidth: number, canvasHeight: number) {
  const tpl = getTemplate(templateId);
  if (!tpl) return;
  const spread = tpl.spread ?? 1;
  page.templateId = templateId;
  page.spread = spread;
  page.canvas.width = canvasWidthFor(panelWidth, spread);
  page.canvas.height = canvasHeight;
  page.objects = tpl.build(panelWidth, canvasHeight);
}
