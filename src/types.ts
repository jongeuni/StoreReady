// Core data model for the App Store Screenshot Builder.
//
// IMPORTANT: all geometry (x, y, left, top, width, fontSize, rotation, ...) is stored
// in FINAL EXPORT PIXEL units for the page's canvas (see DevicePreset). The editor may
// render the canvas at a smaller viewport scale, but that scale is purely a rendering
// concern applied at the Konva Stage level — it must never leak into stored object data.

export type DevicePreset = {
  id: string;
  label: string;
  /** Marketing copy shown next to the preset, e.g. "iPhone 6.9" (16 Pro Max, ...)" */
  description: string;
  width: number;
  height: number;
};

export type SolidBackground = {
  type: 'solid';
  color: string;
};

export type GradientBackground = {
  type: 'gradient';
  colors: [string, string];
  angle: number; // degrees
};

// Reserved for a future premium tier — see Background union below.
export type ImageBackground = {
  type: 'image';
  image: string; // data URL
};

export type Background = SolidBackground | GradientBackground | ImageBackground;

export type BaseObject = {
  id: string;
  rotation: number;
  zIndex: number;
  locked?: boolean;
};

export type TextRole = 'headline' | 'subheadline' | 'body';

/** A contiguous colored run of characters within a TextObject, used for partial (per-character) coloring. */
export type TextRun = {
  text: string;
  color: string;
};

export type TextObject = BaseObject & {
  type: 'text';
  role: TextRole;
  text: string;
  /** When present (2+ entries), overrides `color` for rendering — segments of `text` with individual colors. */
  runs?: TextRun[];
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: number | string;
  color: string;
  align: 'left' | 'center' | 'right';
  lineHeight: number;
};

/** Device placeholder kinds — all share the same object shape, just different frame geometry. */
export type DeviceKind = 'phone' | 'tablet' | 'watch';

export type PhoneObject = BaseObject & {
  type: 'phone';
  deviceKind?: DeviceKind; // defaults to 'phone' when absent (older persisted data)
  screenshotName: string;
  /** Optional free-form note about what this screen should show — extra context for an AI capture agent. */
  screenshotDescription?: string;
  image?: string; // data URL of the uploaded screenshot
  imageFileName?: string;
  width: number;
  top: number;
  left: number;
};

export type ShapeKind = 'rect' | 'ellipse';

export type ShapeObject = BaseObject & {
  type: 'shape';
  shapeKind: ShapeKind;
  width: number;
  height: number;
  top: number;
  left: number;
  fill: string;
  cornerRadius?: number; // rect only
};

export type CanvasObject = TextObject | PhoneObject | ShapeObject;

export type TargetFramework =
  | 'expo'
  | 'react-native-cli'
  | 'flutter'
  | 'ios-native'
  | 'android-native'
  | 'other';

export type Page = {
  id: string;
  label: string;
  templateId?: string;
  canvas: {
    width: number;
    height: number;
    background: Background;
  };
  objects: CanvasObject[];
};

export type Project = {
  id: string;
  name: string;
  devicePresetId: string;
  targetFramework: TargetFramework;
  pages: Page[];
};
