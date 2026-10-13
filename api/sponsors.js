// Serverless endpoint (Vercel-style: /api/sponsors) that powers the sponsor parts of the Reference page.
//
// It returns two things:
//   • sponsors — display names + coffee counts of Buy Me a Coffee supporters
//   • apps     — App Store apps that sponsors asked to be featured, found automatically
//
// How a sponsor gets their app featured: they paste their App Store link
// (https://apps.apple.com/.../id123456789) into the message of their Buy Me a Coffee support. We pull the
// app id out of that message and look the app up in Apple's public iTunes Lookup API (no key needed) to get
// its name, icon, screenshots and store link — so nobody has to open a pull request or send files.
//
// The Buy Me a Coffee API needs a personal access token, which must never reach the browser, so the browser
// calls this function and this function calls Buy Me a Coffee. Environment variables (set on the host):
//   BMC_ACCESS_TOKEN            required — token from https://developers.buymeacoffee.com/ (Developer Dashboard)
//   SPONSOR_APP_MIN_COFFEES     optional — total coffees a supporter needs before their app is shown (default 1)
//   SPONSOR_APP_MAX             optional — most sponsored apps to show (default 6)
//   SPONSOR_APP_DENYLIST        optional — comma-separated App Store ids that must never be shown
//
// Only public display names, coffee counts and App Store metadata are returned — never emails, notes or
// payment details. NOTE: the Buy Me a Coffee field names used below (payer_name, support_coffees,
// support_note, ...) follow its API but could not be verified without a token; check them against a real
// response before launch.

const BMC_SUPPORTERS_URL = 'https://developers.buymeacoffee.com/api/v1/supporters';
const ITUNES_LOOKUP_URL = 'https://itunes.apple.com/lookup';
const MAX_PAGES = 5;
const MAX_SPONSORS = 60;

// apps.apple.com/<country>/app/<slug>/id<digits>  (also the older itunes.apple.com form)
const APP_LINK_RE = /https?:\/\/(?:apps|itunes)\.apple\.com\/(?:([a-z]{2})\/)?[^\s"'<>]*?\/id(\d{5,12})/i;

/** Pulls the first App Store link out of a free-text message. */
export function extractAppLink(text) {
  const m = typeof text === 'string' ? text.match(APP_LINK_RE) : null;
  return m ? { id: m[2], country: (m[1] || 'us').toLowerCase() } : null;
}

/** Only Apple's own image CDN is trusted for the icon and screenshots we hand to the browser. */
function trustedImage(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname.endsWith('.mzstatic.com');
  } catch {
    return false;
  }
}

async function lookupApp({ id, country }, fetchImpl) {
  const response = await fetchImpl(`${ITUNES_LOOKUP_URL}?id=${encodeURIComponent(id)}&country=${encodeURIComponent(country)}`);
  if (!response.ok) return null;
  const json = await response.json();
  const app = (json.results ?? []).find((r) => r.kind === 'software' || r.wrapperType === 'software');
  if (!app || !trustedImage(app.artworkUrl512 ?? app.artworkUrl100)) return null;

  const phoneShots = (app.screenshotUrls ?? []).filter(trustedImage);
  const shots = phoneShots.length > 0 ? phoneShots : (app.ipadScreenshotUrls ?? []).filter(trustedImage);
  if (shots.length === 0) return null;

  let link = null;
  try {
    const u = new URL(app.trackViewUrl);
    if (u.hostname === 'apps.apple.com') link = `${u.origin}${u.pathname}`;
  } catch {
    // no usable link — the card simply won't have a GET button
  }
  return {
    id: String(app.trackId ?? id),
    name: String(app.trackName ?? '').slice(0, 80),
    icon: app.artworkUrl512 ?? app.artworkUrl100,
    screenshots: shots.slice(0, 6),
    link,
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  await respond(res, globalThis.fetch, process.env);
}

/** Separated from `handler` so it can be tested with a fake fetch and fake environment. */
export async function respond(res, fetchImpl, env) {
  const token = env.BMC_ACCESS_TOKEN;
  if (!token) {
    res.status(200).json({ sponsors: [], apps: [] });
    return;
  }

  try {
    const totals = new Map(); // supporter name -> coffees
    const appRequests = new Map(); // app id -> { link, sponsor, coffees }

    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetchImpl(`${BMC_SUPPORTERS_URL}?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Buy Me a Coffee responded ${response.status}`);
      const json = await response.json();

      for (const s of json.data ?? []) {
        const name = String(s.payer_name ?? s.supporter_name ?? '').trim();
        if (!name || s.is_refunded || s.support_visibility === 0) continue;
        const coffees = Number(s.support_coffees) || 1;
        totals.set(name, (totals.get(name) ?? 0) + coffees);

        const link = extractAppLink(s.support_note ?? s.message ?? s.note);
        if (link && !appRequests.has(link.id)) appRequests.set(link.id, { link, sponsor: name });
      }
      if (!json.next_page_url) break;
    }

    const sponsors = [...totals.entries()]
      .map(([name, coffees]) => ({ name: name.slice(0, 60), coffees }))
      .sort((a, b) => b.coffees - a.coffees)
      .slice(0, MAX_SPONSORS);

    // Sponsored apps: only supporters above the coffee threshold, minus the denylist, biggest supporters first.
    const minCoffees = Math.max(1, Number(env.SPONSOR_APP_MIN_COFFEES) || 1);
    const maxApps = Math.max(0, Number(env.SPONSOR_APP_MAX ?? 6));
    const denied = new Set(String(env.SPONSOR_APP_DENYLIST ?? '').split(',').map((v) => v.trim()).filter(Boolean));
    const candidates = [...appRequests.entries()]
      .map(([id, r]) => ({ id, ...r, coffees: totals.get(r.sponsor) ?? 0 }))
      .filter((c) => c.coffees >= minCoffees && !denied.has(c.id))
      .sort((a, b) => b.coffees - a.coffees)
      .slice(0, maxApps);

    const found = await Promise.all(candidates.map((c) => lookupApp(c.link, fetchImpl).catch(() => null)));
    const apps = found
      .map((app, i) => (app ? { ...app, sponsor: candidates[i].sponsor.slice(0, 60), coffees: candidates[i].coffees } : null))
      .filter(Boolean);

    res.status(200).json({ sponsors, apps });
  } catch (err) {
    console.error(err);
    res.status(200).json({ sponsors: [], apps: [] });
  }
}
