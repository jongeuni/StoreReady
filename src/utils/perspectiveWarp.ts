export type Point = [number, number];

/** Maps the unit square onto an arbitrary convex quad (corners TL, TR, BR, BL) with true perspective. */
function unitSquareToQuad(q: [Point, Point, Point, Point]) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let h = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const dx1 = x1 - x2;
    const dx2 = x3 - x2;
    const dy1 = y1 - y2;
    const dy2 = y3 - y2;
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  return (u: number, v: number): Point => {
    const w = g * u + h * v + 1;
    return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w];
  };
}

/** Draws the affine image of triangle `s` (source px) onto triangle `d` (dest px), clipped to `d`. */
function drawTriangle(ctx: CanvasRenderingContext2D, src: CanvasImageSource, s: [Point, Point, Point], d: [Point, Point, Point]) {
  const [[sx0, sy0], [sx1, sy1], [sx2, sy2]] = s;
  const [[dx0, dy0], [dx1, dy1], [dx2, dy2]] = d;
  const det = sx0 * (sy1 - sy2) - sx1 * (sy0 - sy2) + sx2 * (sy0 - sy1);
  if (Math.abs(det) < 1e-9) return;
  const a = (dx0 * (sy1 - sy2) - dx1 * (sy0 - sy2) + dx2 * (sy0 - sy1)) / det;
  const b = (dy0 * (sy1 - sy2) - dy1 * (sy0 - sy2) + dy2 * (sy0 - sy1)) / det;
  const c = (dx0 * (sx2 - sx1) - dx1 * (sx2 - sx0) + dx2 * (sx1 - sx0)) / det;
  const dd = (dy0 * (sx2 - sx1) - dy1 * (sx2 - sx0) + dy2 * (sx1 - sx0)) / det;
  const e = (dx0 * (sx1 * sy2 - sx2 * sy1) - dx1 * (sx0 * sy2 - sx2 * sy0) + dx2 * (sx0 * sy1 - sx1 * sy0)) / det;
  const f = (dy0 * (sx1 * sy2 - sx2 * sy1) - dy1 * (sx0 * sy2 - sx2 * sy0) + dy2 * (sx0 * sy1 - sx1 * sy0)) / det;

  // Grow the clip triangle a hair from its centre so neighbouring triangles overlap instead of leaving seams.
  const cx = (dx0 + dx1 + dx2) / 3;
  const cy = (dy0 + dy1 + dy2) / 3;
  const grow = (p: Point): Point => {
    const vx = p[0] - cx;
    const vy = p[1] - cy;
    const len = Math.hypot(vx, vy) || 1;
    return [p[0] + (vx / len) * 0.6, p[1] + (vy / len) * 0.6];
  };
  const [g0, g1, g2] = [grow(d[0]), grow(d[1]), grow(d[2])];

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(g0[0], g0[1]);
  ctx.lineTo(g1[0], g1[1]);
  ctx.lineTo(g2[0], g2[1]);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(a, b, c, dd, e, f);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
}

/**
 * Warps `src` (a canvas/image of size srcW × srcH) onto the quad `quad` (dest pixel coords, TL,TR,BR,BL)
 * of `ctx`, using a grid of small triangles so perspective foreshortening comes out right.
 */
export function drawWarped(
  ctx: CanvasRenderingContext2D,
  src: CanvasImageSource,
  srcW: number,
  srcH: number,
  quad: [Point, Point, Point, Point],
  grid = 24,
) {
  const map = unitSquareToQuad(quad);
  for (let j = 0; j < grid; j++) {
    for (let i = 0; i < grid; i++) {
      const u0 = i / grid;
      const u1 = (i + 1) / grid;
      const v0 = j / grid;
      const v1 = (j + 1) / grid;
      const s00: Point = [u0 * srcW, v0 * srcH];
      const s10: Point = [u1 * srcW, v0 * srcH];
      const s11: Point = [u1 * srcW, v1 * srcH];
      const s01: Point = [u0 * srcW, v1 * srcH];
      const d00 = map(u0, v0);
      const d10 = map(u1, v0);
      const d11 = map(u1, v1);
      const d01 = map(u0, v1);
      drawTriangle(ctx, src, [s00, s10, s11], [d00, d10, d11]);
      drawTriangle(ctx, src, [s00, s11, s01], [d00, d11, d01]);
    }
  }
}
