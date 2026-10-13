// Loads every app folder under ./apps at build time, so adding an app never touches code:
//
//   src/reference/apps/<your-app>/app.json
//   src/reference/apps/<your-app>/icon.svg                 (or icon.png / icon.webp)
//   src/reference/apps/<your-app>/screenshots/en/1.png     (a set per language: en, ko, ja, ...)
//   src/reference/apps/<your-app>/screenshots/ko/1.png
//   src/reference/apps/<your-app>/screenshots/1.png        (or just one flat set, used for every language)
//
// See ./README.md for the full contributor guide.

import { cleanAppStoreLink, cleanGooglePlayLink } from './links';

export type ReferenceApp = {
  slug: string;
  name: string;
  appStore?: string;
  googlePlay?: string;
  /** One line, or one line per language ({ "en": "...", "ko": "..." }). */
  tagline?: string | Record<string, string>;
  icon?: string;
  /** Screenshot sets keyed by language folder; screenshots placed directly in screenshots/ are under "default". */
  screenshotSets: Record<string, string[]>;
};

type AppJson = {
  name?: string;
  /** Same as `appStore`; kept so older app.json files keep working. */
  link?: string;
  appStore?: string;
  googlePlay?: string;
  tagline?: string | Record<string, string>;
  order?: number;
};

const metas = import.meta.glob<AppJson>('./apps/*/app.json', { eager: true, import: 'default' });
const icons = import.meta.glob<string>('./apps/*/icon.{svg,png,webp}', { eager: true, query: '?url', import: 'default' });
const shots = import.meta.glob<string>('./apps/*/screenshots/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const slugOf = (path: string) => path.split('/')[2];

function cleanTagline(value: unknown): ReferenceApp['tagline'] {
  if (typeof value === 'string') return value.trim().slice(0, 120) || undefined;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([k, v]) => [k, (v as string).trim().slice(0, 120)] as const);
    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return undefined;
}

export function loadReferenceApps(): ReferenceApp[] {
  const apps: (ReferenceApp & { order: number })[] = [];

  for (const [path, meta] of Object.entries(metas)) {
    const slug = slugOf(path);
    const name = meta.name?.trim();

    // Group this app's screenshots by language folder, each set in file-name order.
    const sets: Record<string, string[]> = {};
    for (const [p, url] of Object.entries(shots).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))) {
      if (slugOf(p) !== slug) continue;
      const rest = p.split('/').slice(4); // after ./apps/<slug>/screenshots/
      const lang = rest.length > 1 ? rest[0] : 'default';
      (sets[lang] ??= []).push(url);
    }

    if (!name || Object.keys(sets).length === 0) {
      console.warn(`[reference] Skipping "${slug}": app.json needs a "name" and screenshots/ needs at least one image.`);
      continue;
    }

    const iconEntry = Object.entries(icons).find(([p]) => slugOf(p) === slug);
    apps.push({
      slug,
      name: name.slice(0, 60),
      // Only links to the real stores are kept (see links.ts), so a PR cannot smuggle in a javascript: URL.
      appStore: cleanAppStoreLink(meta.appStore ?? meta.link),
      googlePlay: cleanGooglePlayLink(meta.googlePlay ?? meta.link),
      tagline: cleanTagline(meta.tagline),
      icon: iconEntry?.[1],
      screenshotSets: sets,
      order: typeof meta.order === 'number' ? meta.order : 1000,
    });
  }

  return apps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map(({ order: _order, ...app }) => app);
}

/** The screenshot set for the viewer's language: exact match, then base language, then English, then any. */
export function screenshotsFor(app: ReferenceApp, lang: string): string[] {
  const sets = app.screenshotSets;
  const base = lang.split('-')[0];
  return sets[lang] ?? sets[base] ?? sets.default ?? sets.en ?? Object.values(sets)[0] ?? [];
}

export function taglineFor(app: ReferenceApp, lang: string): string | undefined {
  const t = app.tagline;
  if (!t || typeof t === 'string') return t;
  return t[lang] ?? t[lang.split('-')[0]] ?? t.en ?? Object.values(t)[0];
}

/** What the big GET button opens: the App Store page, or Google Play if that's the only store. */
export function primaryLink(app: ReferenceApp): string | undefined {
  return app.appStore ?? app.googlePlay;
}
