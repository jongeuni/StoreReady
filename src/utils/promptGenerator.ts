import type { Page, Project, TargetFramework } from '../types';
import { getDevicePreset } from '../devicePresets';
import { buildPageData } from './screenshotInfo';

export const FRAMEWORK_LABELS: Record<TargetFramework, string> = {
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

function instructions(framework: TargetFramework, names: string[]): string {
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

/** Full AI capture prompt: natural-language instructions for the agent, plus the JSON design spec. */
export function buildFullPrompt(project: Project, pages: Page[]): string {
  const preset = getDevicePreset(project.devicePresetId);
  const names = screenshotNamesFor(pages);
  const pagesData = pages.map(buildPageData);
  return `${instructions(project.targetFramework, names)}

---
Design specification (JSON) for ${pages.length} page(s) — target export size ${preset.width}x${preset.height} (${preset.label}):

${JSON.stringify({ pages: pagesData }, null, 2)}
`;
}
