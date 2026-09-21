# StoreReady

> 앱을 내 마음대로, 간편하게 보여줘요 — App Store 스크린샷 만들기.

[English](README.md) · **한국어** · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português (Brasil)](README.pt-BR.md)

**https://app-ready.store**

StoreReady는 App Store 홍보 스크린샷을 만드는 무료 브라우저 기반 에디터입니다. 제목, 부제, 기기 목업(폰·태블릿·워치)을 배치하고 내 스크린샷을 넣어 App Store 규격의 PNG로 정확하게 내보낼 수 있습니다. 계정도 백엔드도 없으며 작업 내용은 브라우저에만 저장됩니다.

## 완성하는 두 가지 방법

1. **전부 직접 만들기** — 기기, 텍스트, 도형, 배경을 배치하고 실제 스크린샷을 올려 내보내면 됩니다. AI 없이도 완성도 높은 앱 홍보 페이지를 혼자서 전부 만들 수 있습니다.
2. **디자인을 AI에게 맡기기** — 폰 자리표시자를 놓고 화면마다 이름을 붙인 뒤, 정확한 레이아웃 명세(위치·색·폰트)가 담긴 프롬프트를 생성합니다. 이를 Claude Code, Cursor 같은 AI 코딩 에이전트에 붙여넣으면 완성 이미지를 만들어 줍니다.

## 주요 기능

- 여러 페이지를 독립적으로 편집
- 모델을 고를 수 있는 폰/태블릿/워치 목업과 기울어진 3D 폰
- 스크린샷 두 장에 걸친 큰 폰 분할 템플릿
- 폰 하나에 스크린샷 여러 장을 넣어 대각선 띠와 경계선으로 분할
- 글자별 색상, 도형, 단색·그라데이션 배경
- App Store 규격의 정확한 PNG / ZIP 내보내기
- 아랍어(오른쪽에서 왼쪽) 포함 17개 언어

## 시작하기

```bash
npm install
npm run dev      # start the Vite dev server
npm run build    # type-check and build for production
npm run preview  # preview the production build
npm run lint     # run Oxlint
```

## 기술 스택

React + TypeScript, 캔버스는 Konva / react-konva, 상태는 Zustand(+ Immer), 로컬 저장은 IndexedDB, Tailwind CSS, framer-motion. 에디터에는 백엔드가 없습니다.

## Made with StoreReady (레퍼런스)

[Reference 페이지](https://app-ready.store/reference)에는 StoreReady로 스크린샷을 만든 실제 앱들이 소개됩니다. 내 앱을 추가하려면 폴더 하나만 추가하는 풀 리퀘스트를 열면 되고, 코드는 건드리지 않습니다.

1. `src/reference/apps/<앱이름>/` 폴더를 만듭니다.
2. `app.json`(`name` 필수, `tagline`·`link` 선택), `icon.svg`(또는 png/webp), 완성된 스크린샷을 `screenshots/`(`1.png`, `2.png`, …)에 넣습니다.
3. `npm run dev`로 `/reference`에서 확인한 뒤 풀 리퀘스트를 엽니다.

자세한 안내: [`src/reference/README.md`](src/reference/README.md). 본인이 소유했거나 노출을 허락받은 앱만 제출해 주세요.

## 기여하기

버그 제보와 아이디어는 [GitHub Issues](https://github.com/jongeuni/StoreReady/issues)로 환영합니다. 풀 리퀘스트도 환영하며, 작은 수정이 아니라면 먼저 이슈를 열어 방향을 맞춰 주세요.

## 후원

StoreReady는 무료입니다. Buy Me a Coffee 후원자는 Reference 페이지 하단에 표시되며, 후원에는 메인 페이지 추천 앱 노출이 포함될 수 있습니다(아래 참고).

### 설정 (배포하는 분께)

후원자 목록은 작은 서버리스 함수 `api/sponsors.js`(Vercel 형식)가 Buy Me a Coffee에서 읽어 옵니다. 호스팅 환경 변수에 `BMC_ACCESS_TOKEN`을 설정하세요. 없으면 목록이 비어 있습니다. `src/config.ts`의 `SPONSOR_URL`을 설정하면 "후원하기" 버튼이 표시됩니다.

## 협업 및 문의

메인 페이지에 앱을 소개하고 싶거나, 제휴·후원·광고 제안이 있으신가요? **hello@app-ready.store**로 메일 주세요. 버그와 기능 요청은 GitHub Issues를 이용해 주세요.
