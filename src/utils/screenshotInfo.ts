import type { Page, PhoneObject, Project, TextObject } from '../types';
import { getDevicePreset } from '../devicePresets';

type PageInfoData = {
  label: string;
  canvas: { width: number; height: number };
  /** Present when the page is several export images laid side by side. */
  spread?: { panels: number; panelWidth: number; note: string };
  background: Page['canvas']['background'];
  headline: ReturnType<typeof describeText> | null;
  subheadline: ReturnType<typeof describeText> | null;
  otherText: ReturnType<typeof describeText>[];
  phones: ReturnType<typeof describePhone>[];
};

function describeText(t: TextObject) {
  return {
    content: t.text,
    top: t.y,
    left: t.x,
    width: t.width,
    fontSize: t.fontSize,
    fontWeight: t.fontWeight,
    color: t.color,
    align: t.align,
    rotate: t.rotation,
  };
}

function describePhone(p: PhoneObject) {
  return {
    img: p.screenshotName,
    ...(p.screenshotDescription ? { desc: p.screenshotDescription } : {}),
    kind: p.deviceKind ?? 'phone',
    width: p.width,
    top: p.top,
    left: p.left,
    rotate: p.rotation,
  };
}

export function buildPageData(page: Page): PageInfoData {
  const headline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'headline');
  const subheadline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'subheadline');
  const otherText = page.objects.filter(
    (o): o is TextObject => o.type === 'text' && o.role !== 'headline' && o.role !== 'subheadline',
  );
  const phones = page.objects.filter((o): o is PhoneObject => o.type === 'phone');

  return {
    label: page.label,
    canvas: { width: page.canvas.width, height: page.canvas.height },
    ...((page.spread ?? 1) > 1
      ? {
          spread: {
            panels: page.spread!,
            panelWidth: page.canvas.width / page.spread!,
            note: `This page is ${page.spread} screenshots laid side by side on one wide canvas. Export it as ${page.spread} separate PNGs, each ${page.canvas.width / page.spread!}px wide, cut at equal widths from left to right. A device may straddle the cut so the panels read as one continuous scene when placed next to each other.`,
          },
        }
      : {}),
    background: page.canvas.background,
    headline: headline ? describeText(headline) : null,
    subheadline: subheadline ? describeText(subheadline) : null,
    otherText: otherText.map(describeText),
    phones: phones.map(describePhone),
  };
}

/** Structured screenshot spec (positions + copy) for the given pages — no natural-language wrapper. */
export function buildScreenshotInfoJson(project: Project, pages: Page[]): string {
  const preset = getDevicePreset(project.devicePresetId);
  const data = {
    exportSize: { width: preset.width, height: preset.height, device: preset.label },
    pages: pages.map(buildPageData),
  };
  return JSON.stringify(data, null, 2);
}
