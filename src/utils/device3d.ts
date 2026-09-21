import type { Render3D } from '../phoneFrame';
import { drawWarped, type Point } from './perspectiveWarp';

const SRC_W = 640;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const tokens = text.includes(' ') ? text.split(' ') : Array.from(text);
  const joiner = text.includes(' ') ? ' ' : '';
  const lines: string[] = [];
  let line = '';
  for (const tok of tokens) {
    const next = line ? line + joiner + tok : tok;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = tok;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The flat, un-warped screen content: the cover-cropped screenshot, or a labelled placeholder. */
function buildScreenSource(r3d: Render3D, image: HTMLImageElement | undefined, title: string, hint: string) {
  const w = SRC_W;
  const h = Math.round(SRC_W * r3d.screenAspect);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  if (image) {
    const boxRatio = w / h;
    const imgRatio = image.naturalWidth / image.naturalHeight;
    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth;
    let sh = image.naturalHeight;
    if (imgRatio > boxRatio) {
      sw = image.naturalHeight * boxRatio;
      sx = (image.naturalWidth - sw) / 2;
    } else {
      sh = image.naturalWidth / boxRatio;
      sy = (image.naturalHeight - sh) / 2;
    }
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, w, h);
  } else {
    ctx.fillStyle = '#1c1c1e';
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8e8e93';
    ctx.font = '600 38px system-ui, sans-serif';
    ctx.fillText(title, w / 2, h / 2 - 20, w * 0.9);
    ctx.fillStyle = '#5b5b60';
    ctx.font = '26px system-ui, sans-serif';
    wrapLines(ctx, hint, w * 0.8).forEach((line, i) => ctx.fillText(line, w / 2, h / 2 + 30 + i * 34));
  }
  return { canvas: c, w, h };
}

/** Warps the screen content onto the baked 3D phone's screen quad, then lays the phone frame over it. */
export function composeDevice3d(
  r3d: Render3D,
  frame: HTMLImageElement,
  image: HTMLImageElement | undefined,
  title: string,
  hint: string,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = r3d.frameWidth;
  out.height = r3d.frameHeight;
  const ctx = out.getContext('2d')!;
  const src = buildScreenSource(r3d, image, title, hint);
  const quad = r3d.quad.map(([x, y]) => [x * r3d.frameWidth, y * r3d.frameHeight] as Point) as [Point, Point, Point, Point];
  drawWarped(ctx, src.canvas, src.w, src.h, quad);
  ctx.drawImage(frame, 0, 0, r3d.frameWidth, r3d.frameHeight);
  return out;
}
