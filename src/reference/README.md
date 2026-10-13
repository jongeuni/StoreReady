# Add your app to Reference

Made your App Store screenshots with StoreReady? Add your app to the **Reference** page with a pull
request. You only add a folder — no code changes needed.

## 1. Create a folder

```
src/reference/apps/<your-app>/
├── app.json
├── icon.svg            (or icon.png / icon.webp)
└── screenshots/
    ├── en/             one set per language (any of en, ko, ja, zh-CN, es, fr, de, ...)
    │   ├── 1.png
    │   └── 2.png
    └── ko/
        ├── 1.png
        └── 2.png
```

Use a short lowercase folder name (e.g. `my-habit-app`).

Only have one language? Put the images straight in `screenshots/` (`screenshots/1.png`, `2.png`, …) and
they are used for every language. With per-language folders, visitors see their own language's set and
fall back to `en` when theirs is missing.

## 2. Fill in `app.json`

```json
{
  "name": "My Habit App",
  "tagline": { "en": "Track habits in one tap", "ko": "탭 한 번으로 습관 기록" },
  "appStore": "https://apps.apple.com/app/id0000000000",
  "googlePlay": "https://play.google.com/store/apps/details?id=com.example.app"
}
```

- `name` — required.
- `appStore` — optional. The big **GET** button opens it. Must be an `https://apps.apple.com/...` link.
- `googlePlay` — optional. If your app is on Android too, an Android icon link appears under the card.
  Must be an `https://play.google.com/store/apps/...` link. (If you only give `googlePlay`, GET opens it.)
- `tagline` — optional, one short line. Either a string, or one line per language like above.
- `order` — optional number; lower comes first. Leave it out to sort alphabetically.

Only links to the App Store and Google Play are accepted; any other link is ignored.

## 3. Add the images

- **Icon** — square, SVG preferred (PNG/WebP at 512×512 or larger also fine).
- **Screenshots** — the finished screenshots you made in StoreReady, portrait, in the order you want
  them shown (`1.png`, `2.png`, …). Keep each under ~300 KB (WebP is great); 3–7 screenshots is plenty.

The card design (App Store-style listing with swiping screenshots) is built in — you don't design it.

## 4. Open the pull request

Only add or change files inside your own `src/reference/apps/<your-app>/` folder. Before opening the
PR, run `npm run dev` and check http://localhost:5173/reference to see your card.

Please only submit apps you own or have permission to show. Pull requests are reviewed by a maintainer
before they are merged; nothing goes live automatically.

## Want your app featured at the top?

The Reference page is open to everyone via pull request. The top **Sponsored apps** section is for
supporters: paste your App Store link in your Buy Me a Coffee message and your app is picked up
automatically. For other featured spots, email **hello@app-ready.store**.
