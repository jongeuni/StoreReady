import { panelWidthOf, spreadGap } from './spread';
import type { ImageObject, Page, PhoneObject, Project, TextObject } from '../types';
import { getDevicePreset } from '../devicePresets';
import { DEFAULT_DIVIDER_COLOR, dividerWidthOf } from './diagonalSplit';

type PageInfoData = {
  label: string;
  canvas: { width: number; height: number };
  /** Present when the page is several export images laid side by side. */
  spread?: { panels: number; panelWidth: number; gap: number };
  background: Page['canvas']['background'];
  headline: ReturnType<typeof describeText> | null;
  subheadline: ReturnType<typeof describeText> | null;
  otherText: ReturnType<typeof describeText>[];
  phones: ReturnType<typeof describePhone>[];
  /** Pictures or logos the user placed directly on the page. */
  images?: ReturnType<typeof describeImage>[];
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

function describeImage(o: ImageObject) {
  return {
    file: o.fileName ?? 'image',
    top: o.top,
    left: o.left,
    width: o.width,
    height: o.height,
    rotate: o.rotation,
    ...(o.cornerRadius ? { cornerRadius: o.cornerRadius } : {}),
    layer: o.zIndex,
  };
}

function describePhone(p: PhoneObject) {
  return {
    img: [p.screenshotName, ...(p.extraThemes ?? []).map((th) => th.name)].join(', '),
    ...((p.extraThemes ?? []).length > 0
      ? {
          themes: [p.screenshotName, ...(p.extraThemes ?? []).map((th) => th.name)],
          ...(p.dividerCuts && p.dividerCuts.length === (p.extraThemes ?? []).length ? { dividerCuts: p.dividerCuts } : {}),
          divider: { width: dividerWidthOf(p), color: p.dividerColor ?? DEFAULT_DIVIDER_COLOR, dashed: p.dividerDashed ?? false },
        }
      : {}),
    ...(p.screenshotDescription ? { desc: p.screenshotDescription } : {}),
    kind: p.deviceKind ?? 'phone',
    model: p.deviceModel,
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
  const images = page.objects.filter((o): o is ImageObject => o.type === 'image');

  return {
    label: page.label,
    canvas: { width: page.canvas.width, height: page.canvas.height },
    ...((page.spread ?? 1) > 1
      ? {
          spread: {
            panels: page.spread!,
            panelWidth: panelWidthOf(page),
            gap: spreadGap(panelWidthOf(page)),
          },
        }
      : {}),
    background: page.canvas.background,
    headline: headline ? describeText(headline) : null,
    subheadline: subheadline ? describeText(subheadline) : null,
    otherText: otherText.map(describeText),
    phones: phones.map(describePhone),
    ...(images.length > 0
      ? {
          images: images.map(describeImage),
        }
      : {}),
  };
}

/** Structured screenshot spec (positions + copy) for the given pages. */
export function buildScreenshotInfoJson(project: Project, pages: Page[]): string {
  const preset = getDevicePreset(project.devicePresetId);
  const data = {
    exportSize: { width: preset.width, height: preset.height, device: preset.label },
    ...(preset.safeArea
      ? {
          safeArea: {
            width: preset.safeArea.width,
            height: preset.safeArea.height,
          },
        }
      : {}),
    pages: pages.map(buildPageData),
  };
  return JSON.stringify(data, null, 2);
}
