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

export type TextObject = BaseObject & {
  type: 'text';
  role: TextRole;
  text: string;
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

export type PhoneObject = BaseObject & {
  type: 'phone';
  screenshotName: string;
  image?: string; // data URL of the uploaded screenshot
  imageFileName?: string;
  width: number;
  top: number;
  left: number;
};

export type CanvasObject = TextObject | PhoneObject;

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
