# StoreReady

Design your App Store screenshots first, then let your AI coding agent capture the real app screens for you.

StoreReady is a visual editor for App Store marketing screenshots. Instead of starting from an
existing screenshot, you design the layout first — headline, subheadline, and one or more phone
placeholders, positioned and sized exactly as they'll appear in the final image. Each phone gets a
**screenshot name** (e.g. `home_full`, `history`). When you're ready, generate a capture prompt for
that name and hand it to Claude Code, Cursor, or any AI coding agent working in your app's own
repository — it captures the real screen and you upload the result back in.

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
