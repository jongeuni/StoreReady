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

/** An extra screenshot theme shown in its own diagonal band of the same phone screen. */
export type PhoneTheme = {
  name: string;
  image?: string;
  imageFileName?: string;
};

export type PhoneObject = BaseObject & {
  type: 'phone';
  deviceKind?: DeviceKind; // defaults to 'phone' when absent (older persisted data)
  /** Specific model within deviceKind (e.g. 'phone-se' vs 'phone-pro-max') — see DEVICE_MODELS. */
  deviceModel?: string;
  screenshotName: string;
  /** Optional free-form note about what this screen should show — a creative brief for the AI designing it. */
  screenshotDescription?: string;
  image?: string; // data URL of the uploaded screenshot
  imageFileName?: string;
  /** More themes beyond the base one (screenshotName/image). With any present, the screen is split into equal diagonal bands. */
  extraThemes?: PhoneTheme[];
  /** Divider line between diagonal bands: thickness in canvas px (0 = none; unset = auto), colour, dashed. */
  dividerWidth?: number;
  dividerColor?: string;
  dividerDashed?: boolean;
  /** Divider positions along the diagonal, as fractions (0..1) of the screen's width + height. Unset = equal bands. */
  dividerCuts?: number[];
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

/** A free picture or logo placed on the page (not inside a device). */
export type ImageObject = BaseObject & {
  type: 'image';
  image: string; // data URL
  fileName?: string;
  width: number;
  height: number;
  top: number;
  left: number;
  cornerRadius?: number;
};

export type CanvasObject = TextObject | PhoneObject | ShapeObject | ImageObject;

export type Page = {
  id: string;
  label: string;
  templateId?: string;
  /** Number of export-sized panels laid side by side on this page (canvas is `spread` × the preset width). Default 1. */
  spread?: number;
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
  /** Free-form context for the AI (app concept, brand/style guidance) to inform the screens it designs. */
  extraNotes?: string;
  pages: Page[];
};
