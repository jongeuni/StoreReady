import type { Page } from '../types';

/** Editor gap between neighbouring panels of a multi-screen page (dropped when exporting). */
export function spreadGap(panelWidth: number): number {
  return Math.round(panelWidth * 0.02);
}

export function panelCount(page: Page): number {
  return page.spread ?? 1;
}

export function panelWidthOf(page: Page): number {
  const n = panelCount(page);
  if (n <= 1) return page.canvas.width;
  // Gap is derived from the panel width, so solve W*n + round(0.02*W)*(n-1) = canvasWidth.
  const approx = page.canvas.width / (n + 0.02 * (n - 1));
  const w = Math.round(approx);
  return w * n + spreadGap(w) * (n - 1) === page.canvas.width ? w : approx;
}

export function canvasWidthFor(panelWidth: number, panels: number): number {
  return panelWidth * panels + spreadGap(panelWidth) * (panels - 1);
}
