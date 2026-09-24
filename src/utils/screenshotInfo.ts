import { panelWidthOf, spreadGap } from './spread';
import type { ImageObject, Page, PhoneObject, Project, TextObject } from '../types';
import { getDevicePreset } from '../devicePresets';
import { getDeviceModel } from '../phoneFrame';
import { DEFAULT_DIVIDER_COLOR, dividerWidthOf } from './diagonalSplit';

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
  /** Pictures or logos the user placed directly on the page. */
  images?: ReturnType<typeof describeImage>[];
  imagesNote?: string;
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
          split: `The phone's screen is divided into ${1 + (p.extraThemes ?? []).length} diagonal bands (equal unless stated otherwise) at 45 degrees ('/' direction, running from the top-left corner to the bottom-right corner, in the order of "themes"). ${p.dividerCuts && p.dividerCuts.length === (p.extraThemes ?? []).length ? `The dividers were moved by hand, so the bands are NOT equal: each divider sits at these fractions of the way along the diagonal from the top-left corner to the bottom-right corner: ${p.dividerCuts.map((c) => c.toFixed(2)).join(', ')}. ` : ''}Each band shows one theme's screen as if the full screen were cut along the diagonals, ${dividerWidthOf(p) > 0 ? `and a ${p.dividerDashed ? 'dashed ' : ''}divider line (${dividerWidthOf(p)}px thick, colour ${p.dividerColor ?? DEFAULT_DIVIDER_COLOR}) is drawn along every boundary.` : 'with no divider line between them.'}`,
        }
      : {}),
    ...(p.screenshotDescription ? { desc: p.screenshotDescription } : {}),
    kind: p.deviceKind ?? 'phone',
    ...(getDeviceModel(p.deviceModel, p.deviceKind ?? 'phone').render3d
      ? { look: '3D-rendered iPhone turned about 25 degrees (slightly tilted in-plane, mild perspective — the left and right edges stay nearly parallel), showing only a thin sliver of its right edge; the screen content is in perspective' }
      : {}),
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
            note: `This page is ${page.spread} screenshots laid side by side on one wide canvas, separated by a ${spreadGap(panelWidthOf(page))}px gap that is NOT part of any image. Export it as ${page.spread} separate PNGs, each ${panelWidthOf(page)}px wide: panel N covers x from N*(${panelWidthOf(page)}+${spreadGap(panelWidthOf(page))}) to that plus ${panelWidthOf(page)}. A device may straddle the gap so the panels read as one continuous scene when placed next to each other.`,
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
          imagesNote:
            'These are pictures or logos the user placed on the page. The files are NOT included in this prompt: reserve exactly this box for each (a neutral placeholder is fine) and ask the user to supply the file, or use an image they already have with that name. Draw them in layer order together with the phones.',
        }
      : {}),
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
