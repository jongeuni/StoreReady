import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DemoStep = {
  title: string;
  body: string;
};

const STEPS: DemoStep[] = [
  {
    title: '1. 빈 캔버스에서 시작해요',
    body: '실제 스크린샷 없이도 App Store 마케팅 이미지 레이아웃 작업을 시작할 수 있어요.',
  },
  {
    title: '2. 폰 placeholder를 놓아요',
    body: '검정 iPhone 모양의 placeholder를 캔버스에 배치하고, 크기와 위치를 자유롭게 조정해요.',
  },
  {
    title: '3. 헤드라인을 적어요',
    body: '전달하고 싶은 메시지를 입력하면 바로 캔버스에 반영돼요. 일부 글자만 색을 다르게 줄 수도 있어요.',
  },
  {
    title: '4. 스크린샷 이름을 정해요',
    body: '"home_full" 같은 이름을 붙여두면, 나중에 AI 코딩 에이전트가 어떤 화면을 디자인해야 하는지 정확히 알 수 있어요.',
  },
  {
    title: '5. 두 번째 폰을 추가해요',
    body: '여러 화면을 한 이미지 안에 겹쳐서 보여줄 수 있어요. 회전과 위치를 조절해 자연스럽게 배치해요.',
  },
  {
    title: '6. 화면을 채우면 완성',
    body: 'AI가 스펙 그대로 만들어준 이미지를 쓰거나, 직접 캡처한 스크린샷을 올려도 돼요. App Store에 제출할 준비 끝.',
  },
];

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="absolute -top-6 left-0 rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400"
    >
      {children}
    </motion.span>
  );
}

function MockPhone({
  x,
  y,
  rotate,
  width,
  visible,
  label,
  filled,
}: {
  x: number;
  y: number;
  rotate: number;
  width: number;
  visible: boolean;
  label?: string;
  filled: boolean;
}) {
  const height = width * 2.16;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7, x, y, rotate: rotate * 2 }}
          animate={{ opacity: 1, scale: 1, x, y, rotate }}
          exit={{ opacity: 0, scale: 0.7 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          className="absolute rounded-[1.4rem] border border-neutral-700 bg-neutral-950 shadow-2xl"
          style={{ width, height, left: '50%', top: '50%', marginLeft: -width / 2, marginTop: -height / 2 }}
        >
          {label && <span className="absolute -top-5 left-0 font-mono text-[9px] text-blue-400">{label}</span>}
          <div className="mx-auto mt-1.5 h-1 w-8 rounded-full bg-black/70" />
          <div className="mx-2 mt-2 overflow-hidden rounded-lg" style={{ height: height - 16 }}>
            <AnimatePresence mode="wait">
              {filled ? (
                <motion.div
                  key="filled"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full w-full bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-emerald-400/30"
                >
                  <div className="flex h-full flex-col gap-1.5 p-2.5">
                    <div className="h-2 w-2/3 rounded bg-white/50" />
                    <div className="mt-1 flex-1 rounded bg-white/10" />
                    <div className="h-2 w-1/2 rounded bg-white/30" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full bg-neutral-900" />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypedLine({ text, active, className }: { text: string; active: boolean; className?: string }) {
  const words = text.split(' ');
  return (
    <p className={className}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ delay: i * 0.06 }}
          className="mr-1.5 inline-block"
        >
          {w}
        </motion.span>
      ))}
    </p>
  );
}

function MockCanvas({ step }: { step: number }) {
  return (
    <div className="relative aspect-[9/16.4] w-full max-w-[380px] overflow-hidden rounded-2xl border border-neutral-800 bg-black shadow-2xl">
      <div className="absolute inset-x-0 top-12 flex flex-col items-center gap-1.5 px-8">
        <TypedLine
          text="One square at a time"
          active={step >= 2}
          className="text-center text-2xl font-bold leading-tight text-white"
        />
        <TypedLine text="Every habit, one tap away" active={step >= 5} className="text-center text-xs text-neutral-400" />
      </div>

      <div className="relative h-full w-full">
        <MockPhone x={0} y={40} rotate={0} width={172} visible={step >= 1 && step < 4} filled={false} />
        <MockPhone
          x={step >= 4 ? -46 : 0}
          y={40}
          rotate={step >= 4 ? -8 : 0}
          width={156}
          visible={step >= 4}
          label="home_full"
          filled={step >= 5}
        />
        <MockPhone x={46} y={30} rotate={7} width={156} visible={step >= 4} label="history" filled={step >= 5} />
        {step >= 3 && step < 4 && <Chip>home_full</Chip>}
      </div>
    </div>
  );
}

export function DemoSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="border-t border-neutral-800 py-20">
      <p className="mx-auto max-w-md text-center text-sm text-neutral-500">스크롤해보세요 — 오른쪽 미리보기가 단계마다 바뀌어요.</p>

      <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="order-2 flex flex-col gap-[22vh] py-[10vh] md:order-1">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              onViewportEnter={() => setActiveStep(i)}
              viewport={{ amount: 0.6, margin: '-20% 0px -20% 0px' }}
              initial={{ opacity: 0.3 }}
              whileInView={{ opacity: 1 }}
              className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-5"
            >
              <h3 className="text-base font-semibold text-neutral-100">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">{s.body}</p>
            </motion.div>
          ))}
        </div>

        <div className="order-1 md:order-2">
          <div className="sticky top-16 flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-neutral-100">만들어지는 과정을 직접 보세요</h2>
            </div>
            <MockCanvas step={activeStep} />
          </div>
        </div>
      </div>
    </section>
  );
}
