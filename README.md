# StoreReady

Design your App Store screenshots first, then let your AI coding agent generate the finished screens for you.

StoreReady is a visual editor for App Store marketing screenshots. Instead of starting from an
existing screenshot, you design the layout first — headline, subheadline, and one or more phone
placeholders, positioned and sized exactly as they'll appear in the final image. Each phone gets a
**screenshot name** and, optionally, a short creative brief for what that screen should show. When
you're ready, generate a prompt from the exact layout spec (positions, colors, fonts) and hand it
to Claude Code, Cursor, or any AI coding agent — it designs and renders that screen's content to
match, and you drop the result back in (or upload a real screenshot instead, if you'd rather).

## Getting started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint

## Stack

React + TypeScript, Konva / react-konva for the canvas, Zustand (+ Immer) for state, IndexedDB for
local persistence. No backend, no accounts — everything lives in the browser for Phase 1.

## Reference apps & sponsors

The **Reference** page (`/reference`) lists real apps whose screenshots were made with StoreReady.
Adding yours is a pull request that only adds a folder — see
[`src/reference/README.md`](src/reference/README.md).

The sponsors list is read from Buy Me a Coffee by a small serverless function
(`api/sponsors.js`). Set `BMC_ACCESS_TOKEN` in your host's environment variables; without it the page
simply shows no sponsors. Set `SPONSOR_URL` in `src/config.ts` to show the "Become a sponsor" button.
