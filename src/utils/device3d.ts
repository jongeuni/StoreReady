import type { Render3D } from '../phoneFrame';
import { drawWarped, type Point } from './perspectiveWarp';
import { bandCentroid, bandPolygon, dividerLines } from './diagonalSplit';

export type ThemeSource = { image?: HTMLImageElement; name: string };
export type DividerStyle = { width: number; phoneWidth: number; color: string; dashed: boolean };

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

function coverDraw(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number) {
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
}

/** The flat, un-warped screen content: cover-cropped screenshot(s) in diagonal bands, or labelled placeholders. */
function buildScreenSource(r3d: Render3D, themes: ThemeSource[], hint: string, divider: DividerStyle) {
  const w = SRC_W;
  const h = Math.round(SRC_W * r3d.screenAspect);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const n = themes.length;

  themes.forEach((theme, i) => {
    ctx.save();
    if (n > 1) {
      const poly = bandPolygon(w, h, n, i);
      ctx.beginPath();
      poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.clip();
    }
    if (theme.image) {
      coverDraw(ctx, theme.image, w, h);
    } else {
      ctx.fillStyle = i % 2 ? '#26262a' : '#1c1c1e';
      ctx.fillRect(0, 0, w, h);
      const [cx, cy] = n > 1 ? bandCentroid(bandPolygon(w, h, n, i)) : [w / 2, h / 2];
      ctx.textAlign = 'center';
      ctx.fillStyle = '#8e8e93';
      ctx.font = '600 38px system-ui, sans-serif';
      ctx.fillText(theme.name, cx, cy - 20, w * 0.7);
      if (n === 1) {
        ctx.fillStyle = '#5b5b60';
        ctx.font = '26px system-ui, sans-serif';
        wrapLines(ctx, hint, w * 0.8).forEach((line, k) => ctx.fillText(line, w / 2, cy + 30 + k * 34));
      }
    }
    ctx.restore();
  });

  if (n > 1 && divider.width > 0) {
    // The un-warped screen is roughly 60% of the phone's drawn width, so scale canvas px into source px.
    const lw = Math.max(1, divider.width * (w / (divider.phoneWidth * 0.6)));
    ctx.strokeStyle = divider.color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    ctx.setLineDash(divider.dashed ? [lw * 4, lw * 3] : []);
    for (const [x1, y1, x2, y2] of dividerLines(w, h, n)) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  }
  return { canvas: c, w, h };
}

/** Warps the screen content onto the baked 3D phone's screen quad, then lays the phone frame over it. */
export function composeDevice3d(
  r3d: Render3D,
  frame: HTMLImageElement,
  themes: ThemeSource[],
  hint: string,
  divider: DividerStyle,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = r3d.frameWidth;
  out.height = r3d.frameHeight;
  const ctx = out.getContext('2d')!;
  const src = buildScreenSource(r3d, themes, hint, divider);
  const quad = r3d.quad.map(([x, y]) => [x * r3d.frameWidth, y * r3d.frameHeight] as Point) as [Point, Point, Point, Point];
  drawWarped(ctx, src.canvas, src.w, src.h, quad);
  ctx.drawImage(frame, 0, 0, r3d.frameWidth, r3d.frameHeight);
  return out;
}
