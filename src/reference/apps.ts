// Loads every app folder under ./apps at build time, so adding an app never touches code:
//
//   src/reference/apps/<your-app>/app.json          { "name": "...", "link": "https://...", "tagline": "..." }
//   src/reference/apps/<your-app>/icon.svg          (or icon.png / icon.webp)
//   src/reference/apps/<your-app>/screenshots/*.png (1.png, 2.png, ... shown in file-name order)
//
// See ./README.md for the full contributor guide.

export type ReferenceApp = {
  slug: string;
  name: string;
  link?: string;
  tagline?: string;
  icon?: string;
  screenshots: string[];
};

type AppJson = { name?: string; link?: string; tagline?: string; order?: number };

const metas = import.meta.glob<AppJson>('./apps/*/app.json', { eager: true, import: 'default' });
const icons = import.meta.glob<string>('./apps/*/icon.{svg,png,webp}', { eager: true, query: '?url', import: 'default' });
const shots = import.meta.glob<string>('./apps/*/screenshots/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

function slugOf(path: string): string {
  return path.split('/')[2];
}

function isHttpUrl(value: string | undefined): value is string {
  return !!value && /^https?:\/\//i.test(value);
}

export function loadReferenceApps(): ReferenceApp[] {
  const apps: (ReferenceApp & { order: number })[] = [];

  for (const [path, meta] of Object.entries(metas)) {
    const slug = slugOf(path);
    const screenshots = Object.entries(shots)
      .filter(([p]) => slugOf(p) === slug)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, url]) => url);
    const name = meta.name?.trim();

    if (!name || screenshots.length === 0) {
      console.warn(`[reference] Skipping "${slug}": app.json needs a "name" and screenshots/ needs at least one image.`);
      continue;
    }

    const iconEntry = Object.entries(icons).find(([p]) => slugOf(p) === slug);
    apps.push({
      slug,
      name,
      // Only http(s) links are used, so a PR cannot smuggle in a javascript: URL.
      link: isHttpUrl(meta.link) ? meta.link : undefined,
      tagline: meta.tagline?.trim() || undefined,
      icon: iconEntry?.[1],
      screenshots,
      order: typeof meta.order === 'number' ? meta.order : 1000,
    });
  }

  return apps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)).map(({ order: _order, ...app }) => app);
}
