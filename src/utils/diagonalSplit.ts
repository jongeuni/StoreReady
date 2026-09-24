export type Pt = [number, number];

/**
 * A screen shared by N themes is cut into N equal "/"-direction bands at 45° (top-left → bottom-right):
 * band i covers the points where x + y lies in [i, i+1] × (w + h) / N.
 */
function clipPolygon(poly: Pt[], keep: (p: Pt) => number): Pt[] {
  // Sutherland–Hodgman against the half-plane keep(p) >= 0.
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const fa = keep(a);
    const fb = keep(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

/** Positions (as x + y) of the n - 1 dividers: equally spaced, then slid along the diagonal by `shift` % of one band. */
function cutPositions(w: number, h: number, n: number, shift: number): number[] {
  const total = w + h;
  const step = total / n;
  const cuts: number[] = [];
  for (let k = 1; k < n; k++) cuts.push(Math.min(total, Math.max(0, k * step + (shift / 100) * step)));
  return cuts;
}

export function bandPolygon(w: number, h: number, n: number, i: number, shift = 0): Pt[] {
  const cuts = cutPositions(w, h, n, shift);
  let poly: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  if (i > 0) poly = clipPolygon(poly, (p) => p[0] + p[1] - cuts[i - 1]);
  if (i < n - 1) poly = clipPolygon(poly, (p) => cuts[i] - (p[0] + p[1]));
  return poly;
}

export function bandCentroid(poly: Pt[]): Pt {
  const n = poly.length || 1;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

/** The divider segments between neighbouring bands (n - 1 of them), each as [x1, y1, x2, y2]. */
export function dividerLines(w: number, h: number, n: number, shift = 0): [number, number, number, number][] {
  return cutPositions(w, h, n, shift).map((c) => {
    const x1 = Math.max(0, c - h);
    const x2 = Math.min(w, c);
    return [x1, c - x1, x2, c - x2];
  });
}

export const DEFAULT_DIVIDER_COLOR = '#ffffff';

/** Divider thickness in canvas px: the user's value, or a thin default relative to the phone's width. */
export function dividerWidthOf(obj: { width: number; dividerWidth?: number }): number {
  return obj.dividerWidth ?? Math.max(1, Math.round(obj.width * 0.004));
}
