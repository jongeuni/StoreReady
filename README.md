# StoreReady

> Make App Store screenshots your way — simply.

**English** · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady is a free, browser-based editor for App Store marketing screenshots. Lay out a headline, subheadline and device mockups (phones, tablets, watches), drop in your own screenshots, and export pixel-exact PNGs at App Store sizes. No account, no backend — your work stays in your browser.

## Two ways to finish

1. **Build it all yourself** — Place devices, text, shapes and backgrounds, upload your real screenshots, and export. You can make a fully designed app promo page entirely on your own — no AI needed.
2. **Hand the design to an AI** — Place phone placeholders, name each screen, and generate a prompt containing the exact layout spec (positions, colors, fonts). Paste it into Claude Code, Cursor or any AI coding agent to produce the finished images.

## Features

- Multiple pages, each edited independently
- Phone / tablet / watch mockups with selectable models, plus a tilted 3D phone
- Split templates: one big phone across two screenshots
- Several screenshots in one phone, split into diagonal bands with a divider line
- Per-letter text colors, shapes, solid and gradient backgrounds
- Exact PNG / ZIP export at App Store sizes
- 17 languages, including right-to-left Arabic

## Getting started

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## Stack

React + TypeScript, Konva / react-konva for the canvas, Zustand (+ Immer) for state, IndexedDB for local persistence, Tailwind CSS, framer-motion. No backend for the editor.

## Made with StoreReady (Reference)

The [Reference page](https://app-ready.store/reference) showcases real apps whose screenshots were made with StoreReady. Adding your app is a pull request that only adds a folder — no code changes:

1. Create `src/reference/apps/<your-app>/`.
2. Add `app.json` (`name`, optional `tagline` and `link`), an `icon.svg` (or png/webp), and your finished screenshots in `screenshots/` (`1.png`, `2.png`, …).
3. Check it at `/reference` with `npm run dev`, then open a pull request.

Full guide: [`src/reference/README.md`](src/reference/README.md). Please only submit apps you own or have permission to show.

## Contributing

Bug reports and ideas are welcome as [GitHub Issues](https://github.com/jongeuni/StoreReady/issues). Pull requests are welcome too — for anything larger than a small fix, please open an issue first so we can agree on the approach.

## Sponsors

StoreReady is free. Supporters on Buy Me a Coffee are listed at the bottom of the Reference page, and sponsorship can include a featured app spot on the main page (see below).

### Configuration (for deployers)

The sponsors list is read from Buy Me a Coffee by a small serverless function, `api/sponsors.js` (Vercel-style). Set the `BMC_ACCESS_TOKEN` environment variable on your host; without it the list is simply empty. Set `SPONSOR_URL` in `src/config.ts` to show the "Become a sponsor" button.

## Collaboration & inquiries

Want your app featured on the main page, or have a partnership, sponsorship or advertising idea? Email **hello@app-ready.store**. For bugs and feature requests, please use GitHub Issues.
