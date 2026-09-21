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

export function bandPolygon(w: number, h: number, n: number, i: number): Pt[] {
  const step = (w + h) / n;
  let poly: Pt[] = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
  ];
  if (i > 0) poly = clipPolygon(poly, (p) => p[0] + p[1] - i * step);
  if (i < n - 1) poly = clipPolygon(poly, (p) => (i + 1) * step - (p[0] + p[1]));
  return poly;
}

export function bandCentroid(poly: Pt[]): Pt {
  const n = poly.length || 1;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

/** The divider segments between neighbouring bands (n - 1 of them), each as [x1, y1, x2, y2]. */
export function dividerLines(w: number, h: number, n: number): [number, number, number, number][] {
  const step = (w + h) / n;
  const lines: [number, number, number, number][] = [];
  for (let k = 1; k < n; k++) {
    const c = k * step;
    const x1 = Math.max(0, c - h);
    const x2 = Math.min(w, c);
    lines.push([x1, c - x1, x2, c - x2]);
  }
  return lines;
}
