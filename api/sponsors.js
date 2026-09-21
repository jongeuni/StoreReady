// Serverless endpoint (Vercel-style: /api/sponsors) that lists Buy Me a Coffee supporters for the site.
//
// The Buy Me a Coffee API needs a personal access token, which must never reach the browser, so the
// browser calls this function and this function calls Buy Me a Coffee. Set BMC_ACCESS_TOKEN in the
// host's environment variables (token from https://developers.buymeacoffee.com/ → Developer Dashboard).
//
// Only public display names and coffee counts are returned — never emails, notes or payment details.
// NOTE: response field names below (payer_name, support_coffees, ...) follow Buy Me a Coffee's API but
// could not be verified without a token; check them against a real response before launch.

const BMC_SUPPORTERS_URL = 'https://developers.buymeacoffee.com/api/v1/supporters';
const MAX_PAGES = 5;
const MAX_SPONSORS = 60;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const token = process.env.BMC_ACCESS_TOKEN;
  if (!token) {
    res.status(200).json({ sponsors: [] });
    return;
  }

  try {
    const totals = new Map();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const response = await fetch(`${BMC_SUPPORTERS_URL}?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Buy Me a Coffee responded ${response.status}`);
      const json = await response.json();

      for (const s of json.data ?? []) {
        const name = String(s.payer_name ?? s.supporter_name ?? '').trim();
        if (!name || s.is_refunded || s.support_visibility === 0) continue;
        totals.set(name, (totals.get(name) ?? 0) + (Number(s.support_coffees) || 1));
      }
      if (!json.next_page_url) break;
    }

    const sponsors = [...totals.entries()]
      .map(([name, coffees]) => ({ name: name.slice(0, 60), coffees }))
      .sort((a, b) => b.coffees - a.coffees)
      .slice(0, MAX_SPONSORS);
    res.status(200).json({ sponsors });
  } catch (err) {
    console.error(err);
    res.status(200).json({ sponsors: [] });
  }
}
