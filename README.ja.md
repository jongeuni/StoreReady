# StoreReady

> アプリを思いのままに、手軽に見せよう — App Store スクリーンショット作成。

[English](README.md) · [한국어](README.ko.md) · **日本語** · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady は、App Store 用のプロモーション用スクリーンショットを作る無料のブラウザ型エディタです。見出し、サブ見出し、デバイスのモックアップ（スマホ・タブレット・ウォッチ）を配置し、自分のスクリーンショットを入れて、App Store の規定サイズの PNG を正確に書き出せます。アカウントもバックエンドも不要で、作業内容はブラウザ内にだけ保存されます。

## 仕上げる2つの方法

1. **全部自分で作る** — デバイス、テキスト、図形、背景を配置し、実際のスクリーンショットをアップロードして書き出すだけ。AI なしでも、完成度の高いアプリ紹介ページをひとりで作れます。
2. **デザインを AI に任せる** — スマホのプレースホルダーを置いて画面ごとに名前を付け、正確なレイアウト仕様（位置・色・フォント）を含むプロンプトを生成します。Claude Code や Cursor などの AI コーディングエージェントに貼り付ければ、完成画像を作ってくれます。

## 主な機能

- 複数ページを独立して編集
- モデルを選べるスマホ/タブレット/ウォッチのモックアップと、傾いた 3D スマホ
- 2枚のスクリーンショットにまたがる大きなスマホの分割テンプレート
- 1台のスマホに複数のスクリーンショットを入れ、斜めの帯と境界線で分割
- 文字ごとの色指定、図形、単色・グラデーション背景
- App Store の規定サイズでの正確な PNG / ZIP 書き出し
- アラビア語（右から左）を含む17言語

## はじめかた

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## 技術スタック

React + TypeScript、キャンバスは Konva / react-konva、状態管理は Zustand（+ Immer）、ローカル保存は IndexedDB、Tailwind CSS、framer-motion。エディタにバックエンドはありません。

## Made with StoreReady（リファレンス）

[Reference ページ](https://app-ready.store/reference)では、StoreReady でスクリーンショットを作った実在のアプリを紹介しています。自分のアプリの追加は、フォルダを1つ追加するだけのプルリクエストで行えます。コードの変更は不要です。

1. `src/reference/apps/<アプリ名>/` フォルダを作ります。
2. `app.json`（`name` は必須、`tagline` と `link` は任意）、`icon.svg`（または png/webp）、完成したスクリーンショットを `screenshots/`（`1.png`、`2.png`、…）に入れます。
3. `npm run dev` で `/reference` を確認してから、プルリクエストを送ります。

詳しいガイド：[`src/reference/README.md`](src/reference/README.md)。ご自身が所有している、または掲載の許可を得ているアプリのみ投稿してください。

## コントリビュート

バグ報告やアイデアは [GitHub Issues](https://github.com/jongeuni/StoreReady/issues) で歓迎します。プルリクエストも歓迎です。小さな修正以外は、先に Issue を立てて方針をすり合わせてください。

## スポンサー

StoreReady は無料です。Buy Me a Coffee の支援者は Reference ページの下部に表示され、スポンサーにはメインページでのおすすめアプリ掲載が含まれる場合があります（下記参照）。

### 設定（デプロイする方向け）

スポンサー一覧は、小さなサーバーレス関数 `api/sponsors.js`（Vercel 形式）が Buy Me a Coffee から取得します。ホスティングの環境変数に `BMC_ACCESS_TOKEN` を設定してください。未設定の場合、一覧は空になります。`src/config.ts` の `SPONSOR_URL` を設定すると「スポンサーになる」ボタンが表示されます。

## コラボレーション・お問い合わせ

メインページへのアプリ掲載や、提携・スポンサー・広告のご提案は **hello@app-ready.store** までメールでご連絡ください。バグや機能要望は GitHub Issues をご利用ください。
