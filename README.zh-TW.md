# StoreReady

> 隨心所欲，輕鬆展示你的 App — 製作 App Store 截圖。

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · **繁體中文** · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady 是一款免費的瀏覽器端 App Store 宣傳截圖編輯器。你可以排版標題、副標題與裝置樣機（手機、平板、手錶），放入自己的截圖，並依 App Store 規定尺寸精確匯出 PNG。不需帳號、不需後端，所有作品只儲存在你的瀏覽器中。

## 兩種完成方式

1. **全部自己動手** — 擺放裝置、文字、形狀與背景，上傳真實截圖後匯出即可。不需要 AI，你一個人就能做出完整設計的 App 宣傳頁。
2. **把設計交給 AI** — 放置手機預留框並為每個畫面命名，接著產生包含精確版面規格（位置、顏色、字型）的提示詞。貼到 Claude Code、Cursor 等 AI 程式助手中，即可產生成品圖片。

## 功能

- 多頁面，可獨立編輯
- 可選型號的手機/平板/手錶樣機，以及傾斜的 3D 手機
- 一支大手機橫跨兩張截圖的分屏範本
- 一支手機放入多張截圖，以對角條帶與分隔線分割
- 逐字上色、形狀、純色與漸層背景
- 依 App Store 尺寸精確匯出 PNG / ZIP
- 支援 17 種語言，包含由右至左的阿拉伯文

## 快速開始

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## 技術堆疊

React + TypeScript，畫布使用 Konva / react-konva，狀態管理使用 Zustand（+ Immer），本機儲存使用 IndexedDB，Tailwind CSS，framer-motion。編輯器沒有後端。

## Made with StoreReady（參考案例）

[Reference 頁面](https://app-ready.store/reference)展示了用 StoreReady 製作截圖的真實 App。新增你的 App 只需送出一個僅新增資料夾的 Pull Request，不需修改程式碼：

1. 建立 `src/reference/apps/<你的 App>/`。
2. 加入 `app.json`（`name` 必填，`tagline` 與 `link` 選填）、`icon.svg`（或 png/webp），並把成品截圖放入 `screenshots/`（`1.png`、`2.png`……）。
3. 用 `npm run dev` 在 `/reference` 檢查效果，然後送出 Pull Request。

完整指南：[`src/reference/README.md`](src/reference/README.md)。請只提交你擁有或已獲授權展示的 App。

## 參與貢獻

歡迎透過 [GitHub Issues](https://github.com/jongeuni/StoreReady/issues) 回報問題與想法，也歡迎送出 Pull Request。除了小修正之外，請先開一個 Issue 討論方案。

## 贊助

StoreReady 是免費的。Buy Me a Coffee 上的支持者會顯示在 Reference 頁面底部，贊助也可包含在首頁展示你的 App（見下文）。

### 設定（給部署者）

贊助者清單由一個小型無伺服器函式 `api/sponsors.js`（Vercel 風格）從 Buy Me a Coffee 讀取。請在主機平台設定環境變數 `BMC_ACCESS_TOKEN`，未設定時清單為空。在 `src/config.ts` 設定 `SPONSOR_URL` 即可顯示「成為贊助者」按鈕。

## 合作與洽詢

想讓你的 App 出現在首頁，或有合作、贊助、廣告想法？請寄信至 **hello@app-ready.store**。Bug 與功能建議請使用 GitHub Issues。
