import { motion } from 'framer-motion';
import { DemoSection } from './DemoSection';

type Props = {
  onStart: () => void;
};

const GITHUB_URL = 'https://github.com/jongeuni/StoreReady';

function GithubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.79-.25.79-.55v-2.14c-3.2.7-3.87-1.36-3.87-1.36-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.76.12 3.05.74.8 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

function GithubLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded border border-neutral-700 px-3 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 ${className}`}
    >
      <GithubIcon />
      GitHub
    </a>
  );
}

function MockPhone({ rotate = 0, className = '', delay = 0 }: { rotate?: number; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: rotate * 2 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{ delay, duration: 0.6, ease: 'easeOut' }}
      className={`h-64 w-32 shrink-0 rounded-[1.6rem] border border-neutral-700 bg-neutral-900 shadow-xl ${className}`}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-black/70" />
        <div className="mx-3 mt-3 h-[13.5rem] rounded-xl bg-neutral-800" />
      </motion.div>
    </motion.div>
  );
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Feature({ title, body, delay = 0 }: { title: string; body: string; delay?: number }) {
  return (
    <FadeIn delay={delay} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5">
      <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{body}</p>
    </FadeIn>
  );
}

export function LandingPage({ onStart }: Props) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-base font-bold tracking-tight">
          Store<span className="text-blue-400">Ready</span>
        </span>
        <div className="flex items-center gap-2">
          <GithubLink />
          <button
            onClick={onStart}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            에디터 열기
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold leading-tight text-neutral-50 md:text-4xl">
              App Store 스크린샷,
              <br />
              레이아웃부터 <span className="text-blue-400">디자인</span>하세요.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-neutral-400">
              Design your App Store screenshots first, then let your AI coding agent capture the real app screens for
              you.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-500">
              실제 스크린샷을 업로드해서 꾸미는 편집기가 아니에요. 헤드라인·서브헤드라인·폰 배치 같은 마케팅
              이미지의 레이아웃을 먼저 디자인하고, 그다음 스크린샷을 채워 넣는 순서로 작업해요.
            </p>
            <div className="mt-7 flex items-center gap-3">
              <button
                onClick={onStart}
                className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                무료로 시작하기
              </button>
              <span className="text-xs text-neutral-500">회원가입 없이 바로 사용 가능</span>
            </div>
          </motion.div>

          <div className="flex items-center justify-center gap-3 py-4">
            <MockPhone rotate={-6} className="translate-y-3" delay={0.1} />
            <MockPhone rotate={5} delay={0.25} />
          </div>
        </section>

        <DemoSection />

        {/* How it works */}
        <section className="border-t border-neutral-800 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-neutral-100">두 가지 방법으로 완성해요</h2>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm text-neutral-500">
              한 페이지 안에서 두 방법을 섞어 써도 괜찮아요 — 한 폰은 업로드, 다른 폰은 AI한테 맡기는 식으로요.
            </p>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <FadeIn delay={0.05} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-sm font-semibold text-blue-300">방법 1 — AI에게 캡처를 맡기기</h3>
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>캔버스에 폰 placeholder를 놓고 각각 screenshot name을 정해요 (예: home_full)</li>
                <li>
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Generate AI Prompt</span> 버튼으로
                  캡처 지시문을 만들어요
                </li>
                <li>그 프롬프트를 Claude Code, Cursor 같은 AI 코딩 도구에 붙여넣으면, AI가 실제 앱 프로젝트에서 해당 화면을 찾아 캡처해줘요</li>
                <li>캡처된 이미지를 다시 해당 phone에 업로드하면 완성</li>
              </ol>
            </FadeIn>

            <FadeIn delay={0.15} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-sm font-semibold text-emerald-300">방법 2 — 내가 직접 캡처해서 완성하기</h3>
              <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>이미 스크린샷이 있다면 phone placeholder를 선택하고 바로 이미지를 업로드해요</li>
                <li>레이아웃과 텍스트를 원하는 대로 조정해요</li>
                <li>
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Download PNG</span> 또는{' '}
                  <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">Export All (ZIP)</span>으로 최종
                  이미지를 내려받아요
                </li>
              </ol>
            </FadeIn>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-neutral-800 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-neutral-100">필요한 건 다 있어요</h2>
          </FadeIn>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Feature delay={0} title="여러 페이지" body="Page 1, 2, 3... 필요한 만큼 마케팅 이미지를 만들고 각각 독립적으로 편집해요." />
            <Feature delay={0.05} title="Phone / Tablet / Watch" body="기기 종류와 세부 모델(iPhone SE, iPad Pro 등)을 자유롭게 바꿀 수 있어요." />
            <Feature delay={0.1} title="AI 캡처 프롬프트" body="스크린샷 위치·문구를 구조화된 프롬프트로 만들어 AI 코딩 에이전트에게 바로 전달해요." />
            <Feature delay={0.15} title="부분 글자 색상" body="헤드라인에서 원하는 단어만 드래그해서 다른 색을 줄 수 있어요." />
            <Feature delay={0.2} title="도형 / 배경" body="사각형·원형 도형과 솔리드·그라디언트 배경으로 레이아웃을 자유롭게 꾸며요." />
            <Feature delay={0.25} title="정확한 export" body={'App Store 제출 규격(6.9"/6.7"/6.5") 그대로 PNG·ZIP으로 내보내요.'} />
          </div>
        </section>

        <FadeIn className="border-t border-neutral-800 py-16 text-center">
          <h2 className="text-2xl font-bold text-neutral-100">지금 바로 시작해보세요</h2>
          <p className="mt-2 text-sm text-neutral-500">가입도, 설치도 필요 없어요. 브라우저에서 바로 작업이 저장돼요.</p>
          <button
            onClick={onStart}
            className="mt-6 rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            무료로 시작하기
          </button>
        </FadeIn>
      </main>

      <footer className="border-t border-neutral-800 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center text-xs text-neutral-600 md:flex-row md:justify-between">
          <span>
            Store<span className="text-blue-400">Ready</span> — Design first, capture later.
          </span>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-neutral-300">
            <GithubIcon className="h-3.5 w-3.5" />
            github.com/jongeuni/StoreReady
          </a>
        </div>
      </footer>
    </div>
  );
}
