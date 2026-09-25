import type { CanvasObject } from '../types';
import { deviceHeightForWidth } from '../phoneFrame';
import { measureTextInk } from './richText';

export type BBox = { x: number; y: number; width: number; height: number };

export function getObjectBBox(obj: CanvasObject): BBox {
  if (obj.type === 'phone') {
    return { x: obj.left, y: obj.top, width: obj.width, height: deviceHeightForWidth(obj.width, obj.deviceKind, obj.deviceModel) };
  }
  if (obj.type === 'shape' || obj.type === 'image') {
    return { x: obj.left, y: obj.top, width: obj.width, height: obj.height };
  }
  // Text: the box hugs the glyphs, so aligning/centering acts on what is actually visible.
  const ink = measureTextInk(obj);
  return { x: obj.x + ink.offsetX, y: obj.y, width: ink.width, height: ink.height };
}

export function unionBBox(boxes: BBox[]): BBox {
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function setObjectPosition(obj: CanvasObject, x: number, y: number): CanvasObject {
  if (obj.type === 'phone' || obj.type === 'shape' || obj.type === 'image') {
    return { ...obj, left: x, top: y };
  }
  return { ...obj, x: x - measureTextInk(obj).offsetX, y };
}

export type AlignType = 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom';

export function computeAlignedPosition(bbox: BBox, reference: BBox, align: AlignType): { x: number; y: number } {
  switch (align) {
    case 'left':
      return { x: reference.x, y: bbox.y };
    case 'center-h':
      return { x: reference.x + (reference.width - bbox.width) / 2, y: bbox.y };
    case 'right':
      return { x: reference.x + reference.width - bbox.width, y: bbox.y };
    case 'top':
      return { x: bbox.x, y: reference.y };
    case 'center-v':
      return { x: bbox.x, y: reference.y + (reference.height - bbox.height) / 2 };
    case 'bottom':
      return { x: bbox.x, y: reference.y + reference.height - bbox.height };
  }
}
