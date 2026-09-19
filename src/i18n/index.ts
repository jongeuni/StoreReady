import { useMemo } from 'react';
import { create } from 'zustand';
import type { DeviceKind } from '../types';
import en, { type Dict, type TKey } from './locales/en';
import ko from './locales/ko';
import ja from './locales/ja';
import zhCN from './locales/zh-CN';
import zhTW from './locales/zh-TW';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import ptBR from './locales/pt-BR';
import ru from './locales/ru';
import it from './locales/it';
import id from './locales/id';
import vi from './locales/vi';
import th from './locales/th';
import tr from './locales/tr';
import ar from './locales/ar';
import hi from './locales/hi';

export type { Dict, TKey };

// A zustand store (not React context) on purpose: react-konva renders the canvas in a separate
// React root, so context doesn't reach text drawn inside <Stage>, but a store hook works anywhere.

export type Lang =
  | 'en' | 'ko' | 'ja' | 'zh-CN' | 'zh-TW' | 'es' | 'fr' | 'de' | 'pt-BR'
  | 'ru' | 'it' | 'id' | 'vi' | 'th' | 'tr' | 'ar' | 'hi';

export const LANGUAGES: { code: Lang; label: string; dir?: 'rtl' }[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt-BR', label: 'Português (Brasil)' },
  { code: 'ru', label: 'Русский' },
  { code: 'it', label: 'Italiano' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ไทย' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'hi', label: 'हिन्दी' },
];

const DICTIONARIES: Partial<Record<Lang, Dict>> = {
  en, ko, ja, 'zh-CN': zhCN, 'zh-TW': zhTW, es, fr, de, 'pt-BR': ptBR, ru, it, id, vi, th, tr, ar, hi,
};

const STORAGE_KEY = 'storeready_lang';

function matchLang(tag: string): Lang | null {
  const lower = tag.toLowerCase();
  if (lower.startsWith('zh')) {
    const traditional = /tw|hk|mo|hant/.test(lower);
    return LANGUAGES.some((l) => l.code === (traditional ? 'zh-TW' : 'zh-CN')) ? ((traditional ? 'zh-TW' : 'zh-CN') as Lang) : null;
  }
  if (lower.startsWith('pt')) return LANGUAGES.some((l) => l.code === 'pt-BR') ? ('pt-BR' as Lang) : null;
  const base = lower.split('-')[0];
  return LANGUAGES.find((l) => l.code.toLowerCase() === base)?.code ?? null;
}

function detectInitialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved as Lang;
  } catch {
    // storage unavailable — fall through to browser language
  }
  const prefs = typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : [];
  for (const tag of prefs) {
    const match = tag ? matchLang(tag) : null;
    if (match) return match;
  }
  return 'en';
}

function applyToDocument(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr';
}

type I18nState = { lang: Lang; setLang: (lang: Lang) => void };

const initialLang = detectInitialLang();
applyToDocument(initialLang);

export const useI18n = create<I18nState>((set) => ({
  lang: initialLang,
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // best-effort persistence
    }
    applyToDocument(lang);
    set({ lang });
  },
}));

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  const template = DICTIONARIES[lang]?.[key] ?? en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export type TFunction = (key: TKey, vars?: Vars) => string;

export function useT(): TFunction {
  const lang = useI18n((s) => s.lang);
  return useMemo(() => (key, vars) => translate(lang, key, vars), [lang]);
}

export const DEVICE_KIND_KEY: Record<DeviceKind, TKey> = {
  phone: 'device.phone',
  tablet: 'device.tablet',
  watch: 'device.watch',
};
