import type { DeviceKind } from './types';

// Shared geometry constants for the device placeholder graphics, so every place that
// needs to know a device object's rendered height (canvas drawing, alignment math,
// bounding-box calculations) agrees on the same aspect ratio per device kind.
type DeviceFrameConfig = {
  aspect: number; // height / width
  cornerRadiusRatio: number; // relative to width
  screenInsetRatio: number; // relative to width
  screenCornerRadiusRatio: number; // relative to width
  showIsland: boolean;
  showCrown: boolean;
};

export const DEVICE_FRAME_CONFIG: Record<DeviceKind, DeviceFrameConfig> = {
  phone: {
    aspect: 2.164, // modelled on a modern iPhone body
    cornerRadiusRatio: 0.13,
    screenInsetRatio: 0.035,
    screenCornerRadiusRatio: 0.105,
    showIsland: true,
    showCrown: false,
  },
  tablet: {
    aspect: 1.36, // modelled on a modern iPad body
    cornerRadiusRatio: 0.055,
    screenInsetRatio: 0.03,
    screenCornerRadiusRatio: 0.03,
    showIsland: false,
    showCrown: false,
  },
  watch: {
    aspect: 1.22, // modelled on the Apple Watch body
    cornerRadiusRatio: 0.42,
    screenInsetRatio: 0.075,
    screenCornerRadiusRatio: 0.32,
    showIsland: false,
    showCrown: true,
  },
};

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

export function deviceHeightForWidth(width: number, kind: DeviceKind = 'phone'): number {
  return Math.round(width * DEVICE_FRAME_CONFIG[kind].aspect);
}

/** @deprecated use deviceHeightForWidth(width, kind) */
export function phoneHeightForWidth(width: number): number {
  return deviceHeightForWidth(width, 'phone');
}
