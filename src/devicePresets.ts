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
  // iPad: up to 3 app previews + 10 screenshots for 12.9" / 13" displays.
  {
    id: 'ipad-13',
    kind: 'tablet',
    label: 'iPad 13"',
    description: 'iPad Pro / Air 13" — portrait',
    width: 2064,
    height: 2752,
  },
  {
    id: 'ipad-13-landscape',
    kind: 'tablet',
    label: 'iPad 13" landscape',
    description: 'iPad Pro / Air 13" — landscape',
    width: 2752,
    height: 2064,
  },
  {
    id: 'ipad-12.9',
    kind: 'tablet',
    label: 'iPad 12.9"',
    description: 'iPad Pro 12.9" — portrait',
    width: 2048,
    height: 2732,
  },
  {
    id: 'ipad-12.9-landscape',
    kind: 'tablet',
    label: 'iPad 12.9" landscape',
    description: 'iPad Pro 12.9" — landscape',
    width: 2732,
    height: 2048,
  },
  // Apple Watch: up to 10 screenshots per size.
  {
    id: 'watch-ultra-3',
    kind: 'watch',
    label: 'Apple Watch Ultra 3',
    description: 'Ultra 3 — 422 × 514',
    width: 422,
    height: 514,
  },
  {
    id: 'watch-ultra-3-alt',
    kind: 'watch',
    label: 'Apple Watch Ultra 3 (alt)',
    description: 'Ultra 3 — 410 × 502',
    width: 410,
    height: 502,
  },
  {
    id: 'watch-series-11',
    kind: 'watch',
    label: 'Apple Watch Series 11',
    description: 'Series 11 — 416 × 496',
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
];

export const DEFAULT_DEVICE_PRESET_ID = DEVICE_PRESETS[0].id;

export function getDevicePreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? DEVICE_PRESETS[0];
}

export const DEVICE_PRESET_GROUPS: { kind: DevicePreset['kind']; label: string }[] = [
  { kind: 'phone', label: 'iPhone' },
  { kind: 'tablet', label: 'iPad' },
  { kind: 'watch', label: 'Apple Watch' },
];
