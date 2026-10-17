import type { DevicePreset } from './types';

// Official Apple App Store Connect screenshot pixel dimensions.
// Source: Apple App Store Connect screenshot specifications, current as of 2026.
// If Apple changes these figures again, update only this file — nothing else
// in the app hardcodes device pixel sizes.
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone-6.9',
    kind: 'phone',
    label: 'iPhone 6.9"',
    description: '16 Pro Max, 15 Pro Max, 14 Pro Max — required set',
    width: 1320,
    height: 2868,
  },
  {
    id: 'iphone-6.7',
    kind: 'phone',
    label: 'iPhone 6.7"',
    description: '15 Plus, 14 Pro Max, 13 Pro Max',
    width: 1290,
    height: 2796,
  },
  {
    id: 'iphone-6.5',
    kind: 'phone',
    label: 'iPhone 6.5"',
    description: '11 Pro Max, XS Max',
    width: 1284,
    height: 2778,
  },
  // Apple's upload slot for iPad accepts any one of 2064×2752, 2752×2064, 2048×2732, or 2732×2048 — the
  // 12.9" and 13" displays share a single requirement, so one portrait + one landscape size covers both.
  {
    id: 'ipad-12.9',
    kind: 'tablet',
    label: 'iPad',
    description: 'iPad Pro / Air 12.9"/13" — portrait',
    width: 2048,
    height: 2732,
  },
  {
    id: 'ipad-12.9-landscape',
    kind: 'tablet',
    label: 'iPad landscape',
    description: 'iPad Pro / Air 12.9"/13" — landscape',
    width: 2732,
    height: 2048,
  },
  // Apple Watch: up to 10 screenshots per size.
  {
    id: 'watch-ultra-4',
    kind: 'watch',
    label: 'Apple Watch Ultra 4',
    description: 'Ultra 4 — 422 × 514',
    width: 422,
    height: 514,
  },
  {
    id: 'watch-ultra-4-alt',
    kind: 'watch',
    label: 'Apple Watch Ultra 4 (alt)',
    description: 'Ultra 4 — 410 × 502',
    width: 410,
    height: 502,
  },
  {
    id: 'watch-series-12',
    kind: 'watch',
    label: 'Apple Watch Series 12',
    description: 'Series 12 — 416 × 496',
    width: 416,
    height: 496,
  },
  {
    id: 'watch-series-9',
    kind: 'watch',
    label: 'Apple Watch Series 9',
    description: 'Series 9 — 396 × 484',
    width: 396,
    height: 484,
  },
  {
    id: 'watch-series-6',
    kind: 'watch',
    label: 'Apple Watch Series 6',
    description: 'Series 6 — 368 × 448',
    width: 368,
    height: 448,
  },
  {
    id: 'watch-series-3',
    kind: 'watch',
    label: 'Apple Watch Series 3',
    description: 'Series 3 — 312 × 390',
    width: 312,
    height: 390,
  },
  // iPhone Duo (foldable): its outer and inner displays each take their own screenshot size. Apple makes
  // screenshots for it mandatory from April 2027 for apps built with the iOS 27.1 SDK or later.
  {
    id: 'iphone-duo-outer',
    kind: 'tablet',
    group: 'duo',
    label: 'iPhone Duo outer display',
    description: 'iPhone Duo — outer display, portrait',
    width: 1398,
    height: 2034,
  },
  {
    id: 'iphone-duo-outer-landscape',
    kind: 'tablet',
    group: 'duo',
    label: 'iPhone Duo outer display landscape',
    description: 'iPhone Duo — outer display, landscape',
    width: 2034,
    height: 1398,
  },
  {
    id: 'iphone-duo-inner',
    kind: 'tablet',
    group: 'duo',
    label: 'iPhone Duo inner display',
    description: 'iPhone Duo — inner display, portrait',
    width: 2007,
    height: 2853,
  },
  {
    id: 'iphone-duo-inner-landscape',
    kind: 'tablet',
    group: 'duo',
    label: 'iPhone Duo inner display landscape',
    description: 'iPhone Duo — inner display, landscape',
    width: 2853,
    height: 2007,
  },
  // Mac App Store screenshots: 16:10, any one of these four sizes (2880×1800, 2560×1600, 1440×900, 1280×800).
  {
    kind: 'laptop',
    id: 'mac-2880',
    group: 'mac',
    label: 'Mac 2880 × 1800',
    description: 'Mac screenshots — 16:10, 2880 × 1800',
    width: 2880,
    height: 1800,
  },
  {
    kind: 'laptop',
    id: 'mac-2560',
    group: 'mac',
    label: 'Mac 2560 × 1600',
    description: 'Mac screenshots — 16:10, 2560 × 1600',
    width: 2560,
    height: 1600,
  },
  {
    kind: 'laptop',
    id: 'mac-1440',
    group: 'mac',
    label: 'Mac 1440 × 900',
    description: 'Mac screenshots — 16:10, 1440 × 900',
    width: 1440,
    height: 900,
  },
  {
    kind: 'laptop',
    id: 'mac-1280',
    group: 'mac',
    label: 'Mac 1280 × 800',
    description: 'Mac screenshots — 16:10, 1280 × 800',
    width: 1280,
    height: 800,
  },
  // App Store creative assets (iOS 27+): artwork for the top of the product page and for search results.
  // Images must be opaque (no alpha). The safe area is what is never cropped or covered by the App Store UI.
  {
    id: 'creative-header',
    kind: 'tablet',
    group: 'creative',
    creative: true,
    label: 'Product page header',
    description: 'Product page header — 21:9, 3840 × 1646 exactly',
    width: 3840,
    height: 1646,
    safeArea: { width: 1646, height: 661 },
  },
  {
    id: 'creative-search',
    kind: 'tablet',
    group: 'creative',
    creative: true,
    label: 'Search results image',
    description: 'Search results — 3:2, 1920 × 1280 up to 3840 × 2560',
    width: 3840,
    height: 2560,
    safeArea: { width: 2168, height: 1030 },
  },
  {
    id: 'creative-universal',
    kind: 'tablet',
    group: 'creative',
    creative: true,
    label: 'Universal asset (header + search)',
    description: 'Universal asset — 16:9, 5244 × 2950, PNG only',
    width: 5244,
    height: 2950,
    safeArea: { width: 1402, height: 962 },
  },
  // Google Play Console screenshot specs: 2–8 images, PNG/JPEG, ≤8MB each, 16:9 or 9:16 aspect ratio,
  // each side between 320px and 3840px. These sizes hit that ratio exactly within the allowed range.
  {
    id: 'android-phone',
    kind: 'phone',
    platform: 'android',
    label: 'Android phone',
    description: 'Phone screenshots — portrait (9:16)',
    width: 1080,
    height: 1920,
  },
  {
    id: 'android-phone-landscape',
    kind: 'phone',
    platform: 'android',
    label: 'Android phone landscape',
    description: 'Phone screenshots — landscape (16:9)',
    width: 1920,
    height: 1080,
  },
  {
    id: 'android-tablet-7',
    kind: 'tablet',
    platform: 'android',
    label: 'Android tablet (7")',
    description: '7-inch tablet screenshots — portrait (9:16)',
    width: 2160,
    height: 3840,
  },
  {
    id: 'android-tablet-7-landscape',
    kind: 'tablet',
    platform: 'android',
    label: 'Android tablet (7") landscape',
    description: '7-inch tablet screenshots — landscape (16:9)',
    width: 3840,
    height: 2160,
  },
];

export const DEFAULT_DEVICE_PRESET_ID = DEVICE_PRESETS[0].id;

export function getDevicePreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? DEVICE_PRESETS[0];
}

/** Dropdown group a preset is listed under. */
export function presetGroupId(p: DevicePreset): string {
  if (p.group) return p.group;
  return p.platform === 'android' ? `android-${p.kind}` : p.kind;
}

export const DEVICE_PRESET_GROUPS: { id: string; label: string }[] = [
  { id: 'phone', label: 'iPhone' },
  { id: 'duo', label: 'iPhone Duo' },
  { id: 'tablet', label: 'iPad' },
  { id: 'mac', label: 'Mac' },
  { id: 'watch', label: 'Apple Watch' },
  { id: 'creative', label: 'App Store header & search art' },
  { id: 'android-phone', label: 'Android Phone' },
  { id: 'android-tablet', label: 'Android Tablet (7")' },
];
