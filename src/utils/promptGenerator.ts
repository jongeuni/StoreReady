import type { Page, PhoneObject, Project, TargetFramework } from '../types';
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

function screenshotsFor(pages: Page[]): Pick<PhoneObject, 'screenshotName' | 'screenshotDescription'>[] {
  // Same screenshot name can appear on more than one page (e.g. each page's auto-naming
  // starts back at "screen_1"). Keep first-seen order, but backfill a description from a
  // later occurrence if the first one didn't have one — don't silently drop it.
  const order: string[] = [];
  const descriptions = new Map<string, string | undefined>();
  for (const page of pages) {
    for (const obj of page.objects) {
      if (obj.type !== 'phone') continue;
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

function instructions(framework: TargetFramework, captureNotes: string | undefined, shots: ReturnType<typeof screenshotsFor>): string {
  const shotList =
    shots.length > 0
      ? shots.map((s) => `- ${s.screenshotName}${s.screenshotDescription ? ` — ${s.screenshotDescription}` : ''}`).join('\n')
      : '(none yet — add phone placeholders in the builder first)';

  return `You are helping prepare App Store marketing screenshots for a mobile app.

I have already designed the marketing layout in a screenshot builder tool. The layout below tells you exactly which app screens I need captured, and where each capture will be placed in the final marketing image (position/size there is for the design tool only — you do not need to reproduce it).

Target app framework (hint only — this is how the app was built, not necessarily how it's captured; if the actual capture tooling differs, e.g. a React Native app captured via the Xcode/Android Studio simulator directly, use whatever actually works for this project): ${FRAMEWORK_LABELS[framework]}.
${captureNotes ? `\nAdditional context from me about how capture actually works here: ${captureNotes}\n` : ''}
Please do the following in THIS app project:
1. Analyze the current app project structure to understand how it is built and run.
2. Determine how to capture a screenshot of a running screen (e.g. simulator/emulator screenshot command, a Detox/Maestro/XCUITest screenshot step, Flutter integration_test golden capture, or a manual run-and-screenshot step — pick whatever fits this project, regardless of what the framework hint above says).
3. For each entry in "screenshots needed" below, figure out what app state / navigation / seed data is required to reach that screen — use its description if one is given. If the app needs mock/seed data to reach a given state (e.g. an empty state vs a populated state), add minimal seeding for it.
4. Run the app (simulator, emulator, or dev build).
5. Navigate to each required screen in the state described by its name/description.
6. Capture a screenshot of that screen.
7. Save each capture as a PNG named exactly after its screenshot name, e.g. "<name>.png" (see list below).
8. Repeat for every screenshot name listed.
9. When done, tell me where the exported PNG files are so I can upload them back into the screenshot builder.

Screenshots needed (name — description):
${shotList}

If a screenshot name is ambiguous (e.g. "home_full") and no description is given, use your best judgement about what app state it refers to, and ask me if you truly cannot infer it.`;
}

/** Full AI capture prompt: natural-language instructions for the agent, plus the JSON design spec. */
export function buildFullPrompt(project: Project, pages: Page[]): string {
  const preset = getDevicePreset(project.devicePresetId);
  const shots = screenshotsFor(pages);
  const pagesData = pages.map(buildPageData);
  return `${instructions(project.targetFramework, project.captureNotes, shots)}

---
Design specification (JSON) for ${pages.length} page(s) — target export size ${preset.width}x${preset.height} (${preset.label}):

${JSON.stringify({ pages: pagesData }, null, 2)}
`;
}
