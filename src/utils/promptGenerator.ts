import type { Page, PhoneObject, Project } from '../types';
import { getDevicePreset } from '../devicePresets';
import { buildPageData } from './screenshotInfo';

function screenshotsFor(pages: Page[]): Pick<PhoneObject, 'screenshotName' | 'screenshotDescription'>[] {
  // Same screenshot name can appear on more than one page (e.g. each page's auto-naming
  // starts back at "screen_1"). Keep first-seen order, but backfill a description from a
  // later occurrence if the first one didn't have one — don't silently drop it.
  const order: string[] = [];
  const descriptions = new Map<string, string | undefined>();
  for (const page of pages) {
    for (const obj of page.objects) {
      if (obj.type !== 'phone') continue;
      for (const th of obj.extraThemes ?? []) {
        if (!descriptions.has(th.name)) {
          order.push(th.name);
          descriptions.set(th.name, undefined);
        }
      }
      if (!descriptions.has(obj.screenshotName)) {
        order.push(obj.screenshotName);
        descriptions.set(obj.screenshotName, obj.screenshotDescription);
      } else if (!descriptions.get(obj.screenshotName) && obj.screenshotDescription) {
        descriptions.set(obj.screenshotName, obj.screenshotDescription);
      }
    }
  }
  return order.map((screenshotName) => ({ screenshotName, screenshotDescription: descriptions.get(screenshotName) }));
}

function instructions(extraNotes: string | undefined, shots: ReturnType<typeof screenshotsFor>): string {
  const shotList =
    shots.length > 0
      ? shots
          .map((s) => `- "${s.screenshotName}"${s.screenshotDescription ? ` — ${s.screenshotDescription}` : ' — (no description given; use your best judgement)'}`)
          .join('\n')
      : '(none yet — add phone placeholders in the builder first)';

  return `You are acting as a visual/graphic designer producing a finished App Store marketing screenshot.

I designed the exact layout for this image in a screenshot builder tool — precise pixel positions, sizes, rotation, fonts, weights, colors, and alignment for the headline/subheadline text and for every phone mockup. This is NOT a request to capture a screenshot from a running app. Your job is to render the complete, finished marketing image yourself, reproducing the layout spec below exactly, and inventing polished, realistic-looking UI content to fill each phone's screen area based on its name/description as a creative brief.
${extraNotes ? `\nAdditional context about the app / desired style, from me: ${extraNotes}\n` : ''}
Please do the following:
1. Read the JSON design specification below carefully: canvas pixel size, background (solid color or gradient), the headline/subheadline (exact text, position, width, font size, font weight, color, alignment, rotation), and each phone (exact position, width, rotation).
2. For each phone entry, its "img" is the name I gave that screen and "desc" (when present) is a short creative brief for what UI content should appear inside that phone's screen — design plausible, polished, on-brand UI for it (e.g. a realistic home screen, list view, empty state, etc. matching the brief). Do not leave phone screens blank or generic — actually design real-looking interface content: navigation bars, text, buttons, icons, lists, whatever fits the brief.
3. Build the full image at the exact canvas pixel dimensions given (e.g. by writing an HTML/CSS or SVG file that reproduces the spec pixel-for-pixel and rendering it to a PNG via a headless browser, or by any other method that gets an exact, pixel-accurate result) — match every position, size, color, font weight, and rotation in the spec precisely; this is a precise reproduction task, not a rough approximation.
4. Export one PNG per page at the exact canvas size given, named after the page label.
5. When done, tell me where the exported PNG files are so I can review them (and re-upload individual phone screens here if I want to swap in a real screenshot later).

Phone screens to design (name — creative brief):
${shotList}`;
}

/** Full AI generation prompt: natural-language instructions for the agent, plus the JSON design spec. */
export function buildFullPrompt(project: Project, pages: Page[]): string {
  const preset = getDevicePreset(project.devicePresetId);
  const shots = screenshotsFor(pages);
  const pagesData = pages.map(buildPageData);
  return `${instructions(project.extraNotes, shots)}

---
Design specification (JSON) for ${pages.length} page(s) — target export size ${preset.width}x${preset.height} (${preset.label}):

${JSON.stringify({ pages: pagesData }, null, 2)}
`;
}
