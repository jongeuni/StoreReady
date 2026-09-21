# Add your app to Reference

Made your App Store screenshots with StoreReady? Add your app to the **Reference** page with a pull
request. You only add a folder — no code changes needed.

## 1. Create a folder

```
src/reference/apps/<your-app>/
├── app.json
├── icon.svg            (or icon.png / icon.webp)
└── screenshots/
    ├── 1.png
    ├── 2.png
    └── 3.png
```

Use a short lowercase folder name (e.g. `my-habit-app`).

## 2. Fill in `app.json`

```json
{
  "name": "My Habit App",
  "tagline": "Track habits in one tap",
  "link": "https://apps.apple.com/app/id0000000000"
}
```

- `name` — required.
- `link` — optional, must start with `https://` (App Store, Google Play or your site).
- `tagline` — optional, one short line.
- `order` — optional number; lower comes first. Leave it out to sort alphabetically.

## 3. Add the images

- **Icon** — square, SVG preferred (PNG/WebP at 512×512 or larger also fine).
- **Screenshots** — the finished screenshots you made in StoreReady, portrait, in the order you want
  them shown (`1.png`, `2.png`, …). Keep each under ~300 KB; 3–5 screenshots is plenty.

The card design (App Store-style listing with swiping screenshots) is built in — you don't design it.

## 4. Open the pull request

Only add or change files inside your own `src/reference/apps/<your-app>/` folder. Before opening the
PR, run `npm run dev` and check http://localhost:5173/reference to see your card.

Please only submit apps you own or have permission to show.

## Want your app featured on the main page?

The Reference page is open to everyone via pull request. Featured spots on the main page are arranged
directly — email **hello@app-ready.store**.
