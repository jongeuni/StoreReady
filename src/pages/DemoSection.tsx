import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEVICE_KIND_KEY, useT, type TKey } from '../i18n';
import type { DeviceKind } from '../types';
import capture1 from '../assets/hero/capture-1.png';
import capture2 from '../assets/hero/capture-2.png';

const STEPS: { title: TKey; body: TKey }[] = [
  { title: 'demo.s1.title', body: 'demo.s1.body' },
  { title: 'demo.s2.title', body: 'demo.s2.body' },
  { title: 'demo.s3.title', body: 'demo.s3.body' },
  { title: 'demo.s4.title', body: 'demo.s4.body' },
  { title: 'demo.s5.title', body: 'demo.s5.body' },
  { title: 'demo.s6.title', body: 'demo.s6.body' },
  { title: 'demo.s7.title', body: 'demo.s7.body' },
];
const LAST = STEPS.length - 1;

// Step indices, so the animation script below reads like the story it tells.
const S_PHONE = 1;
const S_HEADLINE = 2;
const S_NAME = 3;
const S_UPLOAD = 4;
const S_SECOND = 5;
const S_MORPH = 6;

const DESIGN_W = 360;
const DESIGN_H = 656;
const KIND_SEQUENCE: DeviceKind[] = ['phone', 'tablet', 'watch'];
const LIME = '#a3e635';

/** Types `text` out one character at a time while `active`; resets when it goes inactive. */
function useTyped(text: string, active: boolean, speed = 55): string {
  const chars = Array.from(text);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) {
      if (count !== 0) setCount(0);
      return;
    }
    if (count >= chars.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [active, count, chars.length, speed]);

  // A language switch changes the text under us — never show more than the new text has.
  return chars.slice(0, Math.min(count, chars.length)).join('');
}

/** The step whose card is closest to the middle of the viewport. */
function useActiveStep(refs: React.RefObject<(HTMLDivElement | null)[]>): number {
  const [active, setActive] = useState(0);

  useEffect(() => {
    let raf = 0;
    const compute = () => {
      const mid = window.innerWidth >= 768 ? window.innerHeight / 2 : window.innerHeight * 0.8;
      let best = 0;
      let bestDist = Infinity;
      refs.current?.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - mid);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [refs]);

  return active;
}

function useCanvasScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const available = window.innerWidth >= 768 ? window.innerHeight - 190 : window.innerHeight * 0.62 - 90;
      setScale(Math.max(0.45, Math.min(1.1, available / DESIGN_H)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

const KIND_SHAPE: Record<DeviceKind, { widthMult: number; aspect: number; radius: number; bezel: number }> = {
  phone: { widthMult: 1, aspect: 2.05, radius: 26, bezel: 6 },
  tablet: { widthMult: 1.3, aspect: 1.36, radius: 16, bezel: 8 },
  watch: { widthMult: 0.7, aspect: 1.22, radius: 30, bezel: 9 },
};

function DeviceMock({
  kind,
  cx,
  cy,
  baseWidth,
  rotate,
  visible,
  label,
  image,
  imageDelay = 0,
}: {
  kind: DeviceKind;
  cx: number;
  cy: number;
  baseWidth: number;
  rotate: number;
  visible: boolean;
  label?: string;
  image?: string;
  imageDelay?: number;
}) {
  const shape = KIND_SHAPE[kind];
  const w = baseWidth * shape.widthMult;
  const h = w * shape.aspect;

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.8,
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        rotate,
        borderRadius: shape.radius,
      }}
      transition={{ type: 'spring', stiffness: 150, damping: 20 }}
      className="absolute border border-neutral-700 bg-neutral-950 shadow-2xl"
      style={{ pointerEvents: 'none' }}
    >
      {label && (
        <span className="absolute -top-5 left-0 whitespace-nowrap font-mono text-[10px] text-blue-400">{label}</span>
      )}
      {kind === 'watch' && <span className="absolute -right-[5px] top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-neutral-700" />}

      <motion.div
        animate={{ borderRadius: Math.max(shape.radius - shape.bezel, 4) }}
        className="absolute overflow-hidden bg-neutral-900"
        style={{ inset: shape.bezel }}
      >
        <AnimatePresence>
          {image && (
            <motion.img
              key={image}
              src={image}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: imageDelay, duration: 0.5 }}
              className="absolute inset-0 h-full w-full object-cover object-top"
            />
          )}
        </AnimatePresence>
        {!image && kind === 'phone' && (
          <span className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-black" />
        )}
        {!image && label && (
          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] text-neutral-500">
            {label}
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}

function splitMarked(text: string): { before: string[]; word: string[]; after: string[] } {
  const m = text.match(/^(.*?)\*\*(.+?)\*\*(.*)$/s);
  if (!m) return { before: Array.from(text), word: [], after: [] };
  return { before: Array.from(m[1]), word: Array.from(m[2]), after: Array.from(m[3]) };
}

function MockCanvas({ step }: { step: number }) {
  const t = useT();
  const headline = t('demo.headline');
  const { before, word, after } = splitMarked(headline);
  const plain = [...before, ...word, ...after].join('');
  const total = before.length + word.length + after.length;

  const typedHeadline = useTyped(plain, step >= S_HEADLINE, 60);
  const typedCount = Array.from(typedHeadline).length;
  const typedBefore = before.slice(0, typedCount).join('');
  const typedWord = word.slice(0, Math.max(0, typedCount - before.length)).join('');
  const typedAfter = after.slice(0, Math.max(0, typedCount - before.length - word.length)).join('');
  const headlineDone = typedCount >= total && total > 0;

  // 0 = plain, 1 = word selected, 2 = recolored
  const [colorPhase, setColorPhase] = useState(0);
  useEffect(() => {
    if (step < S_HEADLINE || !headlineDone) {
      setColorPhase(0);
      return;
    }
    const selectId = setTimeout(() => setColorPhase(1), 350);
    const colorId = setTimeout(() => setColorPhase(2), 1200);
    return () => {
      clearTimeout(selectId);
      clearTimeout(colorId);
    };
  }, [step, headlineDone]);

  const typedName = useTyped('home_full', step >= S_NAME, 70);
  const historyName = useTyped('history', step >= S_SECOND, 70);

  // Step 7: the devices keep morphing phone -> tablet -> watch.
  const [kindIdx, setKindIdx] = useState(0);
  useEffect(() => {
    if (step < S_MORPH) {
      setKindIdx(0);
      return;
    }
    const id = setInterval(() => setKindIdx((i) => i + 1), 1700);
    return () => clearInterval(id);
  }, [step]);
  const morphing = step >= S_MORPH;
  const kindA = morphing ? KIND_SEQUENCE[kindIdx % 3] : 'phone';
  const kindB = morphing ? KIND_SEQUENCE[(kindIdx + 1) % 3] : 'phone';

  const twoPhones = step >= S_SECOND;
  const singleBase = 178;
  const pairBase = 150;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      <motion.div
        animate={{ opacity: morphing ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="absolute inset-0 bg-gradient-to-b from-lime-500/25 via-transparent to-blue-500/25"
      />

      {/* Headline: invisible full text reserves the layout so typing never reflows */}
      <div className="absolute inset-x-7 top-11 text-center text-[27px] font-bold leading-tight text-white">
        <div className="invisible" aria-hidden>
          {plain}
        </div>
        <div className="absolute inset-0">
          {typedBefore}
          <span
            className={`rounded transition-colors duration-500 ${colorPhase === 1 ? 'bg-blue-500/40' : ''}`}
            style={{ color: colorPhase === 2 ? LIME : '#fff' }}
          >
            {typedWord}
          </span>
          {typedAfter}
          {step >= S_HEADLINE && !headlineDone && (
            <span className="ml-px inline-block h-[0.95em] w-[2px] translate-y-[3px] animate-pulse bg-blue-400" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {step === S_HEADLINE && colorPhase >= 1 && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-[132px] flex -translate-x-1/2 items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[11px] text-neutral-300 shadow-lg"
          >
            <motion.span
              className="h-3.5 w-3.5 rounded-full border border-white/20"
              animate={{ backgroundColor: ['#ffffff', '#60a5fa', '#f472b6', LIME] }}
              transition={{ duration: 1, times: [0, 0.35, 0.65, 1] }}
            />
            {t('demo.colorLabel')}
            <span className="font-mono text-neutral-500">{colorPhase === 2 ? LIME : '…'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.p
        animate={{ opacity: morphing ? 1 : 0, y: morphing ? 0 : 8 }}
        transition={{ duration: 0.5, delay: morphing ? 0.3 : 0 }}
        className="absolute inset-x-8 top-[128px] text-center text-[13px] text-neutral-300"
      >
        {t('demo.sub')}
      </motion.p>

      <DeviceMock
        kind={kindA}
        cx={twoPhones ? 122 : DESIGN_W / 2}
        cy={twoPhones ? 446 : 440}
        baseWidth={twoPhones ? pairBase : singleBase}
        rotate={twoPhones ? -6 : 0}
        visible={step >= S_PHONE}
        label={step >= S_NAME ? typedName : undefined}
        image={step >= S_UPLOAD ? capture1 : undefined}
        imageDelay={step === S_UPLOAD ? 0.9 : 0}
      />
      <DeviceMock
        kind={kindB}
        cx={twoPhones ? 238 : DESIGN_W + 120}
        cy={426}
        baseWidth={pairBase}
        rotate={twoPhones ? 5 : 12}
        visible={twoPhones}
        label={twoPhones ? historyName : undefined}
        image={twoPhones ? capture2 : undefined}
        imageDelay={0.5}
      />

      {/* "Upload" pill flying in above the phone during the screenshot step */}
      <AnimatePresence>
        {step === S_UPLOAD && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute left-1/2 top-[190px] w-40 -translate-x-1/2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 shadow-lg"
          >
            <div className="font-mono text-[10px] text-neutral-300">home_full.png</div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-800">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.85, ease: 'easeInOut' }}
                className="h-full rounded-full bg-emerald-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device-type indicator for the final morph step */}
      <motion.div
        animate={{ opacity: morphing ? 1 : 0, y: morphing ? 0 : 10 }}
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/90 p-1"
      >
        {KIND_SEQUENCE.map((k) => (
          <span
            key={k}
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-300 ${
              kindA === k ? 'bg-blue-600 text-white' : 'text-neutral-500'
            }`}
          >
            {t(DEVICE_KIND_KEY[k])}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

export function DemoSection() {
  const t = useT();
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const active = useActiveStep(stepRefs);
  const scale = useCanvasScale();

  return (
    <section className="border-t border-neutral-800 pt-20">
      <p className="mx-auto max-w-md px-4 text-center text-sm text-neutral-500">{t('demo.hint')}</p>

      <div className="mt-10 grid md:grid-cols-2 md:gap-16">
        {/* Pinned until the last step's card has scrolled up to the middle of the screen */}
        <div className="order-1 md:order-2">
          <div className="sticky top-0 z-10 flex h-[62vh] flex-col items-center justify-center gap-4 bg-neutral-950 md:h-screen md:bg-transparent">
            <h2 className="px-4 text-center text-xl font-bold text-neutral-100 md:text-2xl">{t('demo.title')}</h2>
            <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: DESIGN_W, height: DESIGN_H }}>
                <MockCanvas step={active} />
              </div>
            </div>

            <AnimatePresence>
              {active < LAST && (
                <motion.button
                  key="skip"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  aria-label={t('demo.skip')}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 text-neutral-400 hover:text-neutral-100 md:bottom-5"
                >
                  <motion.span
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <span className="text-[10px] uppercase tracking-wider">{t('demo.skip')}</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="order-2 py-[10vh] md:order-1 md:py-[15vh]">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="flex h-[50vh] items-center md:h-[70vh]"
            >
              <motion.div
                animate={{ opacity: active === i ? 1 : 0.3, x: active === i ? 0 : -8 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5"
              >
                <h3 className="text-base font-semibold text-neutral-100">{t(s.title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{t(s.body)}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <div ref={endRef} />
    </section>
  );
}
