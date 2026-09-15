import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

// Project state can contain multi-megabyte data-URL screenshots, which routinely
// exceed localStorage's ~5MB quota. IndexedDB has a much larger practical limit,
// so we use it as the persistence backend for zustand's persist middleware.
export const idbStorage: StateStorage = {
  getItem: async (name) => (await get(name)) ?? null,
  setItem: async (name, value) => {
    try {
      await set(name, value);
    } catch (err) {
      console.error('Failed to save project — your browser storage may be full.', err);
    }
  },
  removeItem: async (name) => {
    await del(name);
  },
};
