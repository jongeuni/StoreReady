import { useMemo, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { buildFullPrompt, FRAMEWORK_LABELS } from '../utils/promptGenerator';
import { Button, SelectField } from './ui/Field';
import type { TargetFramework } from '../types';

const STEPS = [
  { step: 1 as const, label: 'Select pages' },
  { step: 2 as const, label: 'Extra info' },
  { step: 3 as const, label: 'Prompt' },
];

function StepHeader() {
  const step = useProjectStore((s) => s.promptWizardStep);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);
  const selectedCount = useProjectStore((s) => s.promptWizardSelectedPageIds.length);

  return (
    <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
      {STEPS.map((s, i) => {
        const reachable = s.step === 1 || selectedCount > 0;
        return (
          <div key={s.step} className="flex items-center gap-2">
            <button
              disabled={!reachable}
              onClick={() => reachable && setStep(s.step)}
              className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-30 ${
                step === s.step ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  step === s.step ? 'bg-white text-blue-600' : 'bg-neutral-700 text-neutral-300'
                }`}
              >
                {s.step}
              </span>
              {s.label}
            </button>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-neutral-700" />}
          </div>
        );
      })}
    </div>
  );
}

function PageSelectStep() {
  const pages = useProjectStore((s) => s.project.pages);
  const selectedIds = useProjectStore((s) => s.promptWizardSelectedPageIds);
  const togglePage = useProjectStore((s) => s.togglePromptWizardPage);
  const setAllSelected = useProjectStore((s) => s.setPromptWizardAllPagesSelected);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">프롬프트에 포함할 페이지를 선택하세요.</p>
        <div className="flex gap-1.5">
          <Button variant="ghost" onClick={() => setAllSelected(true)}>
            전체 선택
          </Button>
          <Button variant="ghost" onClick={() => setAllSelected(false)}>
            전체 해제
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        {pages.map((page, i) => (
          <label
            key={page.id}
            className="flex cursor-pointer items-center gap-2 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:border-neutral-700"
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(page.id)}
              onChange={() => togglePage(page.id)}
              className="h-4 w-4 accent-blue-600"
            />
            {i + 1}. {page.label}
            <span className="ml-auto text-xs text-neutral-500">
              {page.objects.filter((o) => o.type === 'phone').length} phone ·{' '}
              {page.objects.filter((o) => o.type === 'text').length} text
            </span>
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="primary" disabled={selectedIds.length === 0} onClick={() => setStep(2)}>
          다음
        </Button>
      </div>
    </div>
  );
}

function ExtraInfoStep() {
  const framework = useProjectStore((s) => s.project.targetFramework);
  const setTargetFramework = useProjectStore((s) => s.setTargetFramework);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);

  const frameworkOptions = (Object.keys(FRAMEWORK_LABELS) as TargetFramework[]).map((value) => ({
    value,
    label: FRAMEWORK_LABELS[value],
  }));

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-neutral-300">
        아래 정보는 스크린샷 이미지 자체(위치/텍스트)엔 필요 없지만, AI가 실제 앱에서 화면을 찾고 캡처하는 데 도움이
        되는 정보예요.
      </p>

      <SelectField
        label="앱 프레임워크"
        value={framework}
        options={frameworkOptions}
        onChange={(v) => setTargetFramework(v)}
      />

      <div className="flex justify-between">
        <Button onClick={() => setStep(1)}>이전</Button>
        <Button variant="primary" onClick={() => setStep(3)}>
          다음
        </Button>
      </div>
    </div>
  );
}

function PromptStep() {
  const project = useProjectStore((s) => s.project);
  const pages = useProjectStore((s) => s.project.pages);
  const selectedIds = useProjectStore((s) => s.promptWizardSelectedPageIds);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);
  const close = useProjectStore((s) => s.closePromptWizard);
  const pushToast = useToastStore((s) => s.push);
  const [copied, setCopied] = useState(false);

  const selectedPages = useMemo(() => pages.filter((p) => selectedIds.includes(p.id)), [pages, selectedIds]);
  const prompt = useMemo(() => buildFullPrompt(project, selectedPages), [project, selectedPages]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      pushToast('클립보드 복사에 실패했습니다. 아래 텍스트를 직접 선택해서 복사해주세요.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4">
      <textarea
        readOnly
        value={prompt}
        className="h-[45vh] w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-300 focus:outline-none"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="flex justify-between">
        <Button onClick={() => setStep(2)}>이전</Button>
        <div className="flex gap-1.5">
          <Button onClick={close}>닫기</Button>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Prompt'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PromptWizardModal() {
  const open = useProjectStore((s) => s.promptWizardOpen);
  const step = useProjectStore((s) => s.promptWizardStep);
  const close = useProjectStore((s) => s.closePromptWizard);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Generate AI Prompt</h2>
          <button onClick={close} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>
        <StepHeader />
        <div className="flex-1 overflow-auto">
          {step === 1 && <PageSelectStep />}
          {step === 2 && <ExtraInfoStep />}
          {step === 3 && <PromptStep />}
        </div>
      </div>
    </div>
  );
}
