import type { TextRun } from '../types';

export type RichSegment = { text: string; color: string; x: number; width: number };
export type RichLine = { segments: RichSegment[]; y: number; width: number };
export type RichLayout = { lines: RichLine[]; totalHeight: number; lineHeightPx: number };

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    measureCtx = canvas.getContext('2d')!;
  }
  return measureCtx;
}

type LayoutOptions = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  maxWidth: number;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
};

/** Greedy word-wrap of the concatenated run text into lines, tracking each line's absolute start offset. */
function wrapLines(ctx: CanvasRenderingContext2D, fullText: string, maxWidth: number): { text: string; startIndex: number }[] {
  const lines: { text: string; startIndex: number }[] = [];
  let paraStart = 0;
  const paragraphs = fullText.split('\n');
  for (const para of paragraphs) {
    if (para === '') {
      lines.push({ text: '', startIndex: paraStart });
    } else {
      const words = para.split(' ');
      let line = '';
      let lineStartIndex = paraStart;
      let cursor = paraStart;
      for (const word of words) {
        const wordStartAbs = cursor;
        const candidateLine = line.length === 0 ? word : `${line} ${word}`;
        if (line.length > 0 && ctx.measureText(candidateLine).width > maxWidth) {
          lines.push({ text: line, startIndex: lineStartIndex });
          line = word;
          lineStartIndex = wordStartAbs;
        } else {
          line = candidateLine;
        }
        cursor = wordStartAbs + word.length + 1;
      }
      lines.push({ text: line, startIndex: lineStartIndex });
    }
    paraStart += para.length + 1;
  }
  return lines;
}

function colorAt(absIndex: number, boundaries: { end: number; color: string }[], fallback: string): string {
  for (const b of boundaries) {
    if (absIndex < b.end) return b.color;
  }
  return boundaries[boundaries.length - 1]?.color ?? fallback;
}

/** Splits one wrapped line's text into contiguous same-color segments, with measured x offsets for the given align. */
function segmentLine(
  ctx: CanvasRenderingContext2D,
  line: { text: string; startIndex: number },
  boundaries: { end: number; color: string }[],
  fallback: string,
  maxWidth: number,
  align: LayoutOptions['align'],
): RichLine['segments'] & { lineWidth?: number } {
  type Raw = { text: string; color: string };
  const raw: Raw[] = [];
  let currentColor: string | null = null;
  let currentText = '';
  for (let i = 0; i < line.text.length; i++) {
    const c = colorAt(line.startIndex + i, boundaries, fallback);
    if (c !== currentColor) {
      if (currentText) raw.push({ text: currentText, color: currentColor! });
      currentColor = c;
      currentText = line.text[i];
    } else {
      currentText += line.text[i];
    }
  }
  if (currentText) raw.push({ text: currentText, color: currentColor! });

  const widths = raw.map((r) => ctx.measureText(r.text).width);
  const lineWidth = widths.reduce((a, b) => a + b, 0);
  let cursor = align === 'left' ? 0 : align === 'center' ? (maxWidth - lineWidth) / 2 : maxWidth - lineWidth;

  const segments: RichSegment[] = raw.map((r, i) => {
    const seg = { text: r.text, color: r.color, x: cursor, width: widths[i] };
    cursor += widths[i];
    return seg;
  });
  return segments;
}

/** Lays out colored text runs into wrapped, aligned lines ready for a Konva sceneFunc to draw. */
export function layoutRichText(runs: TextRun[], opts: LayoutOptions): RichLayout {
  const ctx = getMeasureContext();
  ctx.font = `${opts.fontWeight} ${opts.fontSize}px ${opts.fontFamily}`;

  const fullText = runs.map((r) => r.text).join('');
  const boundaries: { end: number; color: string }[] = [];
  let acc = 0;
  for (const r of runs) {
    acc += r.text.length;
    boundaries.push({ end: acc, color: r.color });
  }
  const fallback = runs[0]?.color ?? '#ffffff';

  const rawLines = wrapLines(ctx, fullText, opts.maxWidth);
  const lineHeightPx = Math.round(opts.fontSize * opts.lineHeight);
  const lines: RichLine[] = rawLines.map((line, i) => {
    const segments = segmentLine(ctx, line, boundaries, fallback, opts.maxWidth, opts.align);
    const width = segments.reduce((max, s) => Math.max(max, s.x + s.width), 0);
    return { segments, y: i * lineHeightPx, width };
  });

  return { lines, totalHeight: lines.length * lineHeightPx, lineHeightPx };
}

/** True when runs meaningfully differ in color (worth using the rich renderer instead of plain Text). */
export function runsHaveMultipleColors(runs: TextRun[] | undefined): runs is TextRun[] {
  if (!runs || runs.length === 0) return false;
  const first = runs[0].color;
  return runs.some((r) => r.color !== first) && runs.length > 1;
}
