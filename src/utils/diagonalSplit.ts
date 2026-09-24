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

/** Smallest allowed gap between two neighbouring dividers (fraction of w + h). */
export const MIN_BAND_GAP = 0.04;

/** Equally spaced divider positions, as fractions of (w + h), for n bands. */
export function equalCuts(n: number): number[] {
  return Array.from({ length: Math.max(0, n - 1) }, (_, k) => (k + 1) / n);
}

/** The stored positions if they fit `n` bands, otherwise the equal split. */
export function resolveCuts(n: number, cuts?: number[]): number[] {
  return cuts && cuts.length === n - 1 ? cuts : equalCuts(n);
}

/** Moves divider `index` to `fraction`, keeping it inside the screen and clear of its neighbours. */
export function moveCut(cuts: number[], index: number, fraction: number): number[] {
  const lo = (index > 0 ? cuts[index - 1] : 0) + MIN_BAND_GAP;
  const hi = (index < cuts.length - 1 ? cuts[index + 1] : 1) - MIN_BAND_GAP;
  const next = cuts.slice();
  next[index] = Math.min(hi, Math.max(lo, fraction));
  return next;
}

export function bandPolygon(w: number, h: number, n: number, i: number, cuts?: number[]): Pt[] {
  const total = w + h;
  const c = resolveCuts(n, cuts).map((f) => f * total);
  let poly: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  if (i > 0) poly = clipPolygon(poly, (p) => p[0] + p[1] - c[i - 1]);
  if (i < n - 1) poly = clipPolygon(poly, (p) => c[i] - (p[0] + p[1]));
  return poly;
}

export function bandCentroid(poly: Pt[]): Pt {
  const n = poly.length || 1;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

/** The divider segments between neighbouring bands (n - 1 of them), each as [x1, y1, x2, y2]. */
export function dividerLines(w: number, h: number, n: number, cuts?: number[]): [number, number, number, number][] {
  return resolveCuts(n, cuts).map((f) => {
    const c = f * (w + h);
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
