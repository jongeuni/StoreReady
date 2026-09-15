import type { DevicePreset } from './types';

// Official Apple App Store Connect screenshot pixel dimensions (portrait).
// Source: Apple App Store Connect screenshot specifications, current as of 2026.
// If Apple changes these figures again, update only this file — nothing else
// in the app hardcodes device pixel sizes.
export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'iphone-6.9',
    label: 'iPhone 6.9"',
    description: '16 Pro Max, 15 Pro Max, 14 Pro Max — required set',
    width: 1320,
    height: 2868,
  },
  {
    id: 'iphone-6.7',
    label: 'iPhone 6.7"',
    description: '15 Plus, 14 Pro Max, 13 Pro Max',
    width: 1290,
    height: 2796,
  },
  {
    id: 'iphone-6.5',
    label: 'iPhone 6.5"',
    description: '11 Pro Max, XS Max',
    width: 1284,
    height: 2778,
  },
];

export const DEFAULT_DEVICE_PRESET_ID = DEVICE_PRESETS[0].id;

export function getDevicePreset(id: string): DevicePreset {
  return DEVICE_PRESETS.find((p) => p.id === id) ?? DEVICE_PRESETS[0];
}
