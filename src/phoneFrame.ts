import type { DeviceKind } from './types';
import phone3dFrame from './assets/phone3d/frame.png';

// Shared geometry for device placeholder graphics. Each DeviceModel is a specific,
// freely-swappable look (e.g. "iPhone SE" vs "iPhone Pro Max") within a broader
// DeviceKind (phone/tablet/watch). Kind drives the JSON export label and which model
// list an object can pick from; model drives the actual frame shape/aspect drawn.
export type DeviceChrome = 'island' | 'homeButton' | 'crown' | 'none';

/** A pre-rendered (baked) 3D device: a transparent-screen frame image plus where its screen's corners are. */
export type Render3D = {
  frameUrl: string;
  frameWidth: number;
  frameHeight: number;
  /** Screen corners TL, TR, BR, BL as 0..1 fractions of the frame image. */
  quad: [[number, number], [number, number], [number, number], [number, number]];
  /** Screen height / width when un-warped, so a screenshot is cover-cropped to the right shape. */
  screenAspect: number;
};

export type DeviceModel = {
  id: string;
  kind: DeviceKind;
  label: string;
  aspect: number; // height / width
  cornerRadiusRatio: number; // relative to width
  screenInsetRatio: number; // relative to width (top/left/right)
  screenInsetBottomRatio: number; // relative to width (bottom — larger for home-button phones)
  screenCornerRadiusRatio: number; // relative to width
  chrome: DeviceChrome;
  render3d?: Render3D;
};

// Within each kind, the FIRST entry is the default used for freshly-added objects and for
// any older persisted object that predates per-model presets (no deviceModel stored yet).
export const DEVICE_MODELS: DeviceModel[] = [
  {
    id: 'phone-standard',
    kind: 'phone',
    label: 'iPhone',
    aspect: 2.168,
    cornerRadiusRatio: 0.13,
    screenInsetRatio: 0.035,
    screenInsetBottomRatio: 0.035,
    screenCornerRadiusRatio: 0.105,
    chrome: 'island',
  },
  {
    id: 'phone-pro-max',
    kind: 'phone',
    label: 'iPhone Pro Max',
    aspect: 2.173,
    cornerRadiusRatio: 0.13,
    screenInsetRatio: 0.032,
    screenInsetBottomRatio: 0.032,
    screenCornerRadiusRatio: 0.1,
    chrome: 'island',
  },
  {
    id: 'phone-se',
    kind: 'phone',
    label: 'iPhone SE',
    aspect: 1.779,
    cornerRadiusRatio: 0.075,
    screenInsetRatio: 0.04,
    screenInsetBottomRatio: 0.13,
    screenCornerRadiusRatio: 0.015,
    chrome: 'homeButton',
  },
  {
    id: 'phone-3d',
    kind: 'phone',
    label: 'iPhone 3D (tilted)',
    aspect: 1.66667,
    cornerRadiusRatio: 0,
    screenInsetRatio: 0,
    screenInsetBottomRatio: 0,
    screenCornerRadiusRatio: 0,
    chrome: 'none',
    render3d: {
      frameUrl: phone3dFrame,
      frameWidth: 900,
      frameHeight: 1500,
      quad: [[0.22854, 0.04393], [0.84483, 0.06125], [0.68836, 0.95545], [0.12559, 0.87075]],
      screenAspect: 2.2532,
    },
  },
  {
    id: 'tablet-standard',
    kind: 'tablet',
    label: 'iPad',
    aspect: 1.439,
    cornerRadiusRatio: 0.05,
    screenInsetRatio: 0.03,
    screenInsetBottomRatio: 0.03,
    screenCornerRadiusRatio: 0.03,
    chrome: 'none',
  },
  {
    id: 'tablet-mini',
    kind: 'tablet',
    label: 'iPad mini',
    aspect: 1.523,
    cornerRadiusRatio: 0.055,
    screenInsetRatio: 0.032,
    screenInsetBottomRatio: 0.032,
    screenCornerRadiusRatio: 0.03,
    chrome: 'none',
  },
  {
    id: 'tablet-pro-11',
    kind: 'tablet',
    label: 'iPad Pro 11"',
    aspect: 1.451,
    cornerRadiusRatio: 0.045,
    screenInsetRatio: 0.028,
    screenInsetBottomRatio: 0.028,
    screenCornerRadiusRatio: 0.028,
    chrome: 'none',
  },
  {
    id: 'tablet-pro-129',
    kind: 'tablet',
    label: 'iPad Pro 12.9"',
    aspect: 1.334,
    cornerRadiusRatio: 0.04,
    screenInsetRatio: 0.025,
    screenInsetBottomRatio: 0.025,
    screenCornerRadiusRatio: 0.025,
    chrome: 'none',
  },
  {
    id: 'watch-45',
    kind: 'watch',
    label: 'Apple Watch 45mm',
    aspect: 1.222,
    cornerRadiusRatio: 0.4,
    screenInsetRatio: 0.07,
    screenInsetBottomRatio: 0.07,
    screenCornerRadiusRatio: 0.3,
    chrome: 'crown',
  },
  {
    id: 'watch-41',
    kind: 'watch',
    label: 'Apple Watch 41mm',
    aspect: 1.222,
    cornerRadiusRatio: 0.42,
    screenInsetRatio: 0.075,
    screenInsetBottomRatio: 0.075,
    screenCornerRadiusRatio: 0.32,
    chrome: 'crown',
  },
  {
    id: 'watch-ultra',
    kind: 'watch',
    label: 'Apple Watch Ultra',
    aspect: 1.224,
    cornerRadiusRatio: 0.38,
    screenInsetRatio: 0.065,
    screenInsetBottomRatio: 0.065,
    screenCornerRadiusRatio: 0.28,
    chrome: 'crown',
  },
];

export const DEVICE_KIND_LABELS: Record<DeviceKind, string> = {
  phone: 'Phone',
  tablet: 'Tablet',
  watch: 'Watch',
};

/** Sensible default placeholder width for a freshly-added device, relative to the page's canvas width. */
export const DEVICE_DEFAULT_WIDTH_RATIO: Record<DeviceKind, number> = {
  phone: 0.62,
  tablet: 0.85,
  watch: 0.28,
};

export function modelsForKind(kind: DeviceKind): DeviceModel[] {
  return DEVICE_MODELS.filter((m) => m.kind === kind);
}

export function defaultModelForKind(kind: DeviceKind): DeviceModel {
  return modelsForKind(kind)[0];
}

/** Resolves a stored model id back to its DeviceModel, falling back to the kind's default (handles
 * older persisted objects that predate per-model presets, or a stale id after a kind change). */
export function getDeviceModel(modelId: string | undefined, kind: DeviceKind = 'phone'): DeviceModel {
  const found = modelId ? DEVICE_MODELS.find((m) => m.id === modelId && m.kind === kind) : undefined;
  return found ?? defaultModelForKind(kind);
}

export function deviceHeightForWidth(width: number, kind: DeviceKind = 'phone', modelId?: string): number {
  return Math.round(width * getDeviceModel(modelId, kind).aspect);
}

/** @deprecated use deviceHeightForWidth(width, kind, modelId) */
export function phoneHeightForWidth(width: number): number {
  return deviceHeightForWidth(width, 'phone');
}
