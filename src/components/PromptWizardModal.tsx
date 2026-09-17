import { useMemo, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { buildFullPrompt } from '../utils/promptGenerator';
import { Button, SelectField, TextField } from './ui/Field';
import { DEVICE_KIND_LABELS, modelsForKind } from '../phoneFrame';
import type { Page, PhoneObject, TextObject } from '../types';

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

function PageReviewCard({ page }: { page: Page }) {
  const updateObject = useProjectStore((s) => s.updateObject);
  const headline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'headline');
  const subheadline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'subheadline');
  const otherText = page.objects.filter(
    (o): o is TextObject => o.type === 'text' && o.role !== 'headline' && o.role !== 'subheadline',
  );
  const phones = page.objects.filter((o): o is PhoneObject => o.type === 'phone');

  return (
    <div className="flex flex-col gap-3 border-t border-neutral-800 bg-neutral-950/60 p-3">
      {headline && (
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          <span>Headline</span>
          <textarea
            value={headline.text}
            onChange={(e) => updateObject(page.id, headline.id, { text: e.target.value, runs: undefined })}
            rows={2}
            className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
      )}

      {subheadline && (
        <label className="flex flex-col gap-1 text-xs text-neutral-400">
          <span>Subheadline</span>
          <textarea
            value={subheadline.text}
            onChange={(e) => updateObject(page.id, subheadline.id, { text: e.target.value, runs: undefined })}
            rows={2}
            className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
      )}

      {otherText.map((t) => (
        <label key={t.id} className="flex flex-col gap-1 text-xs text-neutral-400">
          <span>Text ({t.role})</span>
          <textarea
            value={t.text}
            onChange={(e) => updateObject(page.id, t.id, { text: e.target.value, runs: undefined })}
            rows={2}
            className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
          />
        </label>
      ))}

      {phones.map((p) => (
        <div key={p.id} className="flex flex-col gap-2 rounded border border-neutral-800 p-2">
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Screenshot name"
              value={p.screenshotName}
              onChange={(v) => updateObject(page.id, p.id, { screenshotName: v })}
            />
            <SelectField
              label={`Model (${DEVICE_KIND_LABELS[p.deviceKind ?? 'phone']})`}
              value={p.deviceModel ?? modelsForKind(p.deviceKind ?? 'phone')[0].id}
              options={modelsForKind(p.deviceKind ?? 'phone').map((m) => ({ value: m.id, label: m.label }))}
              onChange={(v) => updateObject(page.id, p.id, { deviceModel: v })}
            />
          </div>
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            <span>Screenshot description</span>
            <textarea
              value={p.screenshotDescription ?? ''}
              onChange={(e) => updateObject(page.id, p.id, { screenshotDescription: e.target.value })}
              rows={2}
              placeholder="e.g. Home screen with 3 completed tasks and the streak banner visible"
              className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>
      ))}

      {!headline && !subheadline && otherText.length === 0 && phones.length === 0 && (
        <p className="text-xs text-neutral-500">이 페이지에는 검토할 텍스트나 phone이 없습니다.</p>
      )}
    </div>
  );
}

function PageSelectStep() {
  const pages = useProjectStore((s) => s.project.pages);
  const selectedIds = useProjectStore((s) => s.promptWizardSelectedPageIds);
  const togglePage = useProjectStore((s) => s.togglePromptWizardPage);
  const setAllSelected = useProjectStore((s) => s.setPromptWizardAllPagesSelected);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">프롬프트에 포함할 페이지를 선택하세요. 화살표를 누르면 내용을 검토·수정할 수 있어요.</p>
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
        {pages.map((page, i) => {
          const expanded = expandedId === page.id;
          return (
            <div key={page.id} className="overflow-hidden rounded border border-neutral-800 bg-neutral-900">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-200">
                <label className="flex flex-1 cursor-pointer items-center gap-2">
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
                <button
                  onClick={() => setExpandedId(expanded ? null : page.id)}
                  title="검토 · 수정"
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-400 transition-transform hover:bg-neutral-800 ${expanded ? 'rotate-180' : ''}`}
                >
                  ▾
                </button>
              </div>
              {expanded && <PageReviewCard page={page} />}
            </div>
          );
        })}
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
  const extraNotes = useProjectStore((s) => s.project.extraNotes ?? '');
  const setExtraNotes = useProjectStore((s) => s.setExtraNotes);
  const setStep = useProjectStore((s) => s.setPromptWizardStep);

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-neutral-300">
        AI가 화면 내용을 디자인할 때 참고할 배경 정보예요. 이 앱이 어떤 앱인지, 어떤 분위기·톤인지 적어두면 각 phone
        화면 안에 더 그럴듯한 UI를 만들어줘요. (레이아웃 자체의 위치·색상·글자는 이미 JSON 스펙에 정확히 포함돼요.)
      </p>

      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        <span>앱 소개 / 스타일 참고 (선택)</span>
        <textarea
          value={extraNotes}
          onChange={(e) => setExtraNotes(e.target.value)}
          rows={4}
          placeholder="예: 하루 계획과 실제 기록을 비교해주는 다이어리 앱입니다. 미니멀하고 딱딱하지 않은 톤으로요."
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
        />
      </label>

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
