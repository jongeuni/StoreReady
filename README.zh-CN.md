# StoreReady

> 随心所欲，轻松展示你的应用 — 制作 App Store 截图。

[English](README.md) · [한국어](README.ko.md) · [日本語](README.ja.md) · **简体中文** · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady 是一款免费的浏览器端 App Store 宣传截图编辑器。你可以排布标题、副标题和设备样机（手机、平板、手表），放入自己的截图，并按 App Store 规定尺寸精确导出 PNG。无需账号、无需后端，所有作品只保存在你的浏览器中。

## 两种完成方式

1. **全部自己动手** — 摆放设备、文字、形状和背景，上传真实截图后导出即可。无需 AI，你一个人就能做出完整设计的应用推广页。
2. **把设计交给 AI** — 放置手机占位框并为每个界面命名，然后生成包含精确布局规格（位置、颜色、字体）的提示词。把它粘贴到 Claude Code、Cursor 等 AI 编码助手中，即可生成成品图片。

## 功能

- 多页面，可独立编辑
- 可选型号的手机/平板/手表样机，以及倾斜的 3D 手机
- 一台大手机横跨两张截图的分屏模板
- 一台手机放入多张截图，以对角条带和分隔线分割
- 逐字上色、形状、纯色和渐变背景
- 按 App Store 尺寸精确导出 PNG / ZIP
- 支持 17 种语言，包括从右到左的阿拉伯语

## 快速开始

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## 技术栈

React + TypeScript，画布使用 Konva / react-konva，状态管理使用 Zustand（+ Immer），本地存储使用 IndexedDB，Tailwind CSS，framer-motion。编辑器没有后端。

## Made with StoreReady（参考案例）

[Reference 页面](https://app-ready.store/reference)展示了用 StoreReady 制作截图的真实应用。添加你的应用只需提交一个仅新增文件夹的 Pull Request，无需修改代码：

1. 创建 `src/reference/apps/<你的应用>/`。
2. 添加 `app.json`（`name` 必填，`tagline` 和 `link` 可选）、`icon.svg`（或 png/webp），并把成品截图放入 `screenshots/`（`1.png`、`2.png`……）。
3. 用 `npm run dev` 在 `/reference` 检查效果，然后提交 Pull Request。

完整指南：[`src/reference/README.md`](src/reference/README.md)。请只提交你拥有或已获授权展示的应用。

## 参与贡献

欢迎通过 [GitHub Issues](https://github.com/jongeuni/StoreReady/issues) 反馈问题和想法，也欢迎提交 Pull Request。除小修小补外，请先开一个 Issue 商定方案。

## 赞助

StoreReady 是免费的。Buy Me a Coffee 上的支持者会显示在 Reference 页面底部，赞助还可包含在主页展示你的应用（见下文）。

### 配置（面向部署者）

赞助者列表由一个小型无服务器函数 `api/sponsors.js`（Vercel 风格）从 Buy Me a Coffee 读取。请在托管平台设置环境变量 `BMC_ACCESS_TOKEN`，未设置时列表为空。在 `src/config.ts` 中设置 `SPONSOR_URL` 即可显示“成为赞助者”按钮。

## 合作与咨询

想让你的应用出现在主页，或有合作、赞助、广告想法？请发邮件至 **hello@app-ready.store**。Bug 和功能建议请使用 GitHub Issues。
