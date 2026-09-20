import { nanoid } from 'nanoid';
import type { CanvasObject, Page, Background } from './types';

export type TemplateId = 'single-phone' | 'dual-phone' | 'split-phone' | 'blank';

export type Template = {
  id: TemplateId;
  label: string;
  description: string;
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
 * One big phone straddling the seam between two neighbouring pages. Both halves are the same device at
 * the same size, offset by one page width, so laid side by side (or swiped in the App Store) they read as one.
 * part 0 = left page (headline + phone's left half), part 1 = right page (phone's right half).
 */
export function buildSplitPhone(canvasWidth: number, canvasHeight: number, linkId: string, part: 0 | 1): CanvasObject[] {
  const phoneWidth = Math.round(canvasWidth * 0.8);
  const phone: CanvasObject = {
    id: nanoid(),
    type: 'phone',
    screenshotName: 'screen_1',
    width: phoneWidth,
    top: Math.round(canvasHeight * 0.3),
    left: part === 0 ? Math.round(canvasWidth - phoneWidth / 2) : Math.round(-phoneWidth / 2),
    rotation: 0,
    zIndex: 1,
    linkId,
  };
  if (part === 1) return [phone];
  const headline = headlineObject(canvasWidth, canvasHeight, 'One screen,\ntwo pages');
  const sub = subheadlineObject(canvasWidth, canvasHeight, 'A single phone that flows across two screenshots.');
  const textWidth = Math.round(canvasWidth * 0.56);
  for (const o of [headline, sub]) {
    if (o.type === 'text') {
      o.x = Math.round(canvasWidth * 0.06);
      o.width = textWidth;
      o.align = 'left';
    }
  }
  return [headline, sub, phone];
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
    description: 'One big phone split across this page and a new next page',
    build: (canvasWidth, canvasHeight) => buildSplitPhone(canvasWidth, canvasHeight, nanoid(), 0),
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
