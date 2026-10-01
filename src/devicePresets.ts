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

export const DEVICE_PRESET_GROUPS: { kind: DevicePreset['kind']; platform?: DevicePreset['platform']; label: string }[] = [
  { kind: 'phone', label: 'iPhone' },
  { kind: 'tablet', label: 'iPad' },
  { kind: 'watch', label: 'Apple Watch' },
  { kind: 'phone', platform: 'android', label: 'Android Phone' },
  { kind: 'tablet', platform: 'android', label: 'Android Tablet (7")' },
];
