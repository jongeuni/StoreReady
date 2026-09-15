import type { Page, PhoneObject, Project, TextObject } from '../types';
import { getDevicePreset } from '../devicePresets';

type PagePromptData = {
  label: string;
  canvas: { width: number; height: number };
  background: Page['canvas']['background'];
  headline: ReturnType<typeof describeText> | null;
  subheadline: ReturnType<typeof describeText> | null;
  otherText: ReturnType<typeof describeText>[];
  phones: {
    img: string;
    width: number;
    top: number;
    left: number;
    rotate: number;
  }[];
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
    width: p.width,
    top: p.top,
    left: p.left,
    rotate: p.rotation,
  };
}

export function buildPageData(page: Page): PagePromptData {
  const headline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'headline');
  const subheadline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'subheadline');
  const otherText = page.objects.filter(
    (o): o is TextObject => o.type === 'text' && o.role !== 'headline' && o.role !== 'subheadline',
  );
  const phones = page.objects.filter((o): o is PhoneObject => o.type === 'phone');

  return {
    label: page.label,
    canvas: { width: page.canvas.width, height: page.canvas.height },
    background: page.canvas.background,
    headline: headline ? describeText(headline) : null,
    subheadline: subheadline ? describeText(subheadline) : null,
    otherText: otherText.map(describeText),
    phones: phones.map(describePhone),
  };
}

const FRAMEWORK_LABELS: Record<Project['targetFramework'], string> = {
  expo: 'Expo / React Native',
  'react-native-cli': 'React Native CLI',
  flutter: 'Flutter',
  'ios-native': 'iOS native (Swift/SwiftUI)',
  'android-native': 'Android native (Kotlin/Compose)',
  other: 'unspecified — infer from the project files',
};

function screenshotNamesFor(pages: Page[]): string[] {
  const names = new Set<string>();
  for (const page of pages) {
    for (const obj of page.objects) {
      if (obj.type === 'phone') names.add(obj.screenshotName);
    }
  }
  return Array.from(names);
}

function instructions(framework: Project['targetFramework'], names: string[]): string {
  return `You are helping prepare App Store marketing screenshots for a mobile app.

I have already designed the marketing layout in a screenshot builder tool. The layout below tells you exactly which app screens I need captured, and where each capture will be placed in the final marketing image (position/size there is for the design tool only — you do not need to reproduce it).

Target app framework: ${FRAMEWORK_LABELS[framework]}.

Please do the following in THIS app project:
1. Analyze the current app project structure to understand how it is built and run.
2. Determine how to capture a screenshot of a running screen (e.g. simulator/emulator screenshot command, a Detox/Maestro/XCUITest screenshot step, Flutter integration_test golden capture, or a manual run-and-screenshot step — pick whatever fits this project).
3. For each entry in "screenshots needed" below, figure out what app state / navigation / seed data is required to reach that screen. If the app needs mock/seed data to reach a given state (e.g. an empty state vs a populated state), add minimal seeding for it.
4. Run the app (simulator, emulator, or dev build).
5. Navigate to each required screen in the state described by its name.
6. Capture a screenshot of that screen.
7. Save each capture as a PNG named exactly after its screenshot name, e.g. "<name>.png" (see list below).
8. Repeat for every screenshot name listed.
9. When done, tell me where the exported PNG files are so I can upload them back into the screenshot builder.

Screenshots needed (by name): ${names.length > 0 ? names.join(', ') : '(none yet — add phone placeholders in the builder first)'}

If a screenshot name is ambiguous (e.g. "home_full"), use your best judgement about what app state it refers to, and ask me if you truly cannot infer it.`;
}

export function generatePagePrompt(project: Project, page: Page): string {
  const preset = getDevicePreset(project.devicePresetId);
  const data = buildPageData(page);
  const names = screenshotNamesFor([page]);
  return `${instructions(project.targetFramework, names)}

---
Design specification (JSON) — target export size ${preset.width}x${preset.height} (${preset.label}):

${JSON.stringify(data, null, 2)}
`;
}

export function generateFullProjectPrompt(project: Project): string {
  const preset = getDevicePreset(project.devicePresetId);
  const names = screenshotNamesFor(project.pages);
  const pagesData = project.pages.map(buildPageData);
  return `${instructions(project.targetFramework, names)}

---
Design specification (JSON) for all ${project.pages.length} page(s) — target export size ${preset.width}x${preset.height} (${preset.label}):

${JSON.stringify({ pages: pagesData }, null, 2)}
`;
}
