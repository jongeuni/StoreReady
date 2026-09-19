import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DemoSection } from './DemoSection';
import { useT } from '../i18n';
import { Rich } from '../i18n/Rich';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import demo1 from '../assets/hero/demo-1.png';
import demo2 from '../assets/hero/demo-2.png';
import demo3 from '../assets/hero/demo-3.png';
import demo4 from '../assets/hero/demo-4.png';

type Props = {
  onStart: () => void;
};

const GITHUB_URL = 'https://github.com/jongeuni/StoreReady';
const HERO_IMAGES = [demo1, demo2, demo3, demo4];

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

const SHOT_W = 136;
const SHOT_GAP = 12;

/** An App Store product-page look-alike: listing header + a screenshot row that swipes along on its own. */
function StoreListing() {
  const t = useT();
  const [index, setIndex] = useState(0);
  const [snap, setSnap] = useState(false);
  const n = HERO_IMAGES.length;
  // Render the set twice so the row can slide past the last shot and wrap invisibly.
  const shots = [...HERO_IMAGES, ...HERO_IMAGES];

  useEffect(() => {
    const id = setInterval(() => {
      setSnap(false);
      setIndex((i) => i + 1);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mx-auto w-full max-w-[22rem]"
    >
      <div className="mb-3 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {t('land.madeBadge')}
        </span>
      </div>
      <div className="overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 p-5 shadow-2xl">
      <div className="flex items-center gap-3.5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.1rem] bg-lime-400 shadow-lg">
          <span className="text-2xl font-black tracking-tight text-neutral-950">D</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-semibold text-neutral-50">Your App</div>
          <div className="mt-0.5 text-xs text-neutral-500">
            <span className="text-amber-400">★★★★★</span> 4.9
          </div>
        </div>
        <span className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-bold text-white">GET</span>
      </div>

      <div className="-mr-5 mt-5 overflow-hidden">
        <motion.div
          className="flex"
          style={{ gap: SHOT_GAP }}
          animate={{ x: -index * (SHOT_W + SHOT_GAP) }}
          transition={snap ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
          onAnimationComplete={() => {
            if (index >= n) {
              setSnap(true);
              setIndex(index - n);
            }
          }}
        >
          {shots.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              draggable={false}
              className="shrink-0 rounded-[1.4rem] border border-neutral-800 object-cover"
              style={{ width: SHOT_W, height: SHOT_W * (2796 / 1290) }}
            />
          ))}
        </motion.div>
      </div>
      </div>
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
  const t = useT();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="text-base font-bold tracking-tight">
          Store<span className="text-blue-400">Ready</span>
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="py-2" />
          <GithubLink />
          <button
            onClick={onStart}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            {t('land.openEditor')}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 py-16 md:grid-cols-2 md:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl font-bold leading-tight text-neutral-50 md:text-4xl">
              <Rich text={t('land.heroTitle')} strong="text-blue-400" />
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">{t('land.heroDesc')}</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={onStart}
                className="rounded bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
              >
                {t('land.start')}
              </button>
              <span className="text-xs text-neutral-500">{t('land.noSignup')}</span>
            </div>
          </motion.div>

          <StoreListing />
        </section>

        <DemoSection />

        {/* How it works */}
        <section className="border-t border-neutral-800 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-neutral-100">{t('how.title')}</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-neutral-500">{t('how.sub')}</p>
          </FadeIn>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Method 1: build it all yourself — the emphasised one */}
            <FadeIn
              delay={0.05}
              className="rounded-lg border border-emerald-500/40 bg-gradient-to-b from-emerald-500/10 to-neutral-900/60 p-6"
            >
              <span className="inline-block rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                {t('how.m1.badge')}
              </span>
              <h3 className="mt-2 text-lg font-bold text-emerald-300">{t('how.m1.title')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                <Rich text={t('how.m1.lead')} strong="font-bold text-emerald-300" />
              </p>
              <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>{t('how.m1.s1')}</li>
                <li>{t('how.m1.s2')}</li>
                <li>
                  <Rich text={t('how.m1.s3', { png: t('top.downloadPng'), zip: t('top.exportAll') })} />
                </li>
              </ol>
            </FadeIn>

            {/* Method 2: hand it to an AI */}
            <FadeIn delay={0.15} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-6">
              <h3 className="text-lg font-bold text-blue-300">{t('how.m2.title')}</h3>
              <ol className="mt-4 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-neutral-300">
                <li>{t('how.m2.s1')}</li>
                <li>
                  <Rich text={t('how.m2.s2', { prompt: t('top.generatePrompt') })} />
                </li>
                <li>{t('how.m2.s3')}</li>
                <li>{t('how.m2.s4')}</li>
              </ol>
            </FadeIn>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-neutral-800 py-16">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold text-neutral-100">{t('feat.title')}</h2>
          </FadeIn>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Feature delay={0} title={t('feat.pages.t')} body={t('feat.pages.b')} />
            <Feature delay={0.05} title={t('feat.devices.t')} body={t('feat.devices.b')} />
            <Feature delay={0.1} title={t('feat.prompt.t')} body={t('feat.prompt.b')} />
            <Feature delay={0.15} title={t('feat.color.t')} body={t('feat.color.b')} />
            <Feature delay={0.2} title={t('feat.shapes.t')} body={t('feat.shapes.b')} />
            <Feature delay={0.25} title={t('feat.export.t')} body={t('feat.export.b')} />
          </div>
        </section>

        <FadeIn className="border-t border-neutral-800 py-16 text-center">
          <h2 className="text-2xl font-bold text-neutral-100">{t('cta.title')}</h2>
          <p className="mt-2 text-sm text-neutral-500">{t('cta.sub')}</p>
          <button
            onClick={onStart}
            className="mt-6 rounded bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            {t('land.start')}
          </button>
        </FadeIn>
      </main>

      <footer className="border-t border-neutral-800 py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center text-xs text-neutral-600 md:flex-row md:justify-between">
          <span>
            Store<span className="text-blue-400">Ready</span> — {t('land.footer')}
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
