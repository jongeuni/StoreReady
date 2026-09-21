// Site-wide links and endpoints in one place.
export const GITHUB_URL = 'https://github.com/jongeuni/StoreReady';

/** Where "How to add your app" points: the contributor guide in the repo. */
export const REFERENCE_GUIDE_URL = `${GITHUB_URL}/blob/main/src/reference/README.md`;

/** Buy Me a Coffee (or similar) page. Leave empty to hide the "Become a sponsor" button. */
export const SPONSOR_URL = '';

/**
 * JSON endpoint that returns `{ sponsors: { name: string; coffees?: number }[] }`.
 * Served by the serverless function in /api/sponsors.js, which holds the Buy Me a Coffee token.
 */
export const SPONSORS_ENDPOINT: string = import.meta.env.VITE_SPONSORS_ENDPOINT ?? '/api/sponsors';
