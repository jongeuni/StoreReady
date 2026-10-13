import { useI18n } from './i18n';
import { loadReferenceApps, screenshotsFor } from './reference/apps';

// The landing page demos (hero card, step 8 "finished result") show the same finished screenshots as the
// Reference page's first app, in the visitor's language — so there is a single place to keep them up to date.
const apps = loadReferenceApps();
const showcaseApp = apps.find((a) => a.slug === 'dayline') ?? apps[0];

/** Finished-screenshot URLs for the landing page demos, in the current UI language. */
export function useShowcaseShots(): string[] {
  const lang = useI18n((s) => s.lang);
  return showcaseApp ? screenshotsFor(showcaseApp, lang) : [];
}
