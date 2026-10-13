// Link checks for the Reference page. App folders come from pull requests, so every link is checked before it
// is ever rendered: only https links to the real store hosts are accepted. Anything else (javascript:, data:,
// look-alike domains, http) is dropped, so a malicious PR cannot smuggle a harmful link onto the page.

function parseHttps(url: unknown, host: string): URL | null {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' && u.hostname === host && !u.username && !u.password ? u : null;
  } catch {
    return null;
  }
}

/** https://apps.apple.com/... — returned without tracking parameters or fragments. */
export function cleanAppStoreLink(url: unknown): string | undefined {
  const u = parseHttps(url, 'apps.apple.com');
  return u ? `${u.origin}${u.pathname}` : undefined;
}

/** https://play.google.com/store/apps/... — keeps only the query that identifies the app (`id`, `hl`). */
export function cleanGooglePlayLink(url: unknown): string | undefined {
  const u = parseHttps(url, 'play.google.com');
  if (!u || !u.pathname.startsWith('/store/apps')) return undefined;
  const keep = new URLSearchParams();
  for (const key of ['id', 'hl']) {
    const value = u.searchParams.get(key);
    if (value && /^[\w.\-]+$/.test(value)) keep.set(key, value);
  }
  const query = keep.toString();
  return `${u.origin}${u.pathname}${query ? `?${query}` : ''}`;
}
