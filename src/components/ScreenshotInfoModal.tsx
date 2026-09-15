import { useMemo, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { buildScreenshotInfoJson } from '../utils/screenshotInfo';
import { Button } from './ui/Field';
import { phoneHeightForWidth } from '../phoneFrame';
import type { Page, PhoneObject, TextObject } from '../types';

const STEPS = [
  { step: 1 as const, label: 'Select pages' },
  { step: 2 as const, label: 'Edit content' },
  { step: 3 as const, label: 'Copy JSON' },
];

function StepHeader() {
  const step = useProjectStore((s) => s.infoModalStep);
  const setStep = useProjectStore((s) => s.setInfoModalStep);
  const selectedCount = useProjectStore((s) => s.infoModalSelectedPageIds.length);

  return (
    <div className="flex items-center gap-2 border-b border-neutral-800 px-4 py-3">
      {STEPS.map((s, i) => {
        const reachable = s.step === 1 || (s.step <= step ? true : selectedCount > 0);
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
  const selectedIds = useProjectStore((s) => s.infoModalSelectedPageIds);
  const togglePage = useProjectStore((s) => s.toggleInfoModalPage);
  const setAllSelected = useProjectStore((s) => s.setInfoModalAllPagesSelected);
  const setStep = useProjectStore((s) => s.setInfoModalStep);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-300">이 정보에 포함할 페이지를 선택하세요.</p>
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

function EditPageCard({ page }: { page: Page }) {
  const updateObject = useProjectStore((s) => s.updateObject);
  const headline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'headline');
  const subheadline = page.objects.find((o): o is TextObject => o.type === 'text' && o.role === 'subheadline');
  const otherText = page.objects.filter(
    (o): o is TextObject => o.type === 'text' && o.role !== 'headline' && o.role !== 'subheadline',
  );
  const phones = page.objects.filter((o): o is PhoneObject => o.type === 'phone');

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-3">
      <h3 className="mb-3 text-sm font-semibold text-neutral-200">{page.label}</h3>

      <div className="flex flex-col gap-3">
        {headline && (
          <label className="flex flex-col gap-1 text-xs text-neutral-400">
            <span>Headline</span>
            <textarea
              value={headline.text}
              onChange={(e) => updateObject(page.id, headline.id, { text: e.target.value })}
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
              onChange={(e) => updateObject(page.id, subheadline.id, { text: e.target.value })}
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
              onChange={(e) => updateObject(page.id, t.id, { text: e.target.value })}
              rows={2}
              className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
            />
          </label>
        ))}

        {phones.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-neutral-400">Phones</span>
            {phones.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <input
                  value={p.screenshotName}
                  onChange={(e) => updateObject(page.id, p.id, { screenshotName: e.target.value })}
                  placeholder="screenshot name"
                  className="w-40 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[11px] text-neutral-500">
                  {p.width}×{phoneHeightForWidth(p.width)} @ ({p.left}, {p.top}) rotate {p.rotation}°
                </span>
              </div>
            ))}
          </div>
        )}

        {!headline && !subheadline && otherText.length === 0 && phones.length === 0 && (
          <p className="text-xs text-neutral-500">이 페이지에는 편집할 텍스트나 phone이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function EditContentStep() {
  const pages = useProjectStore((s) => s.project.pages);
  const selectedIds = useProjectStore((s) => s.infoModalSelectedPageIds);
  const setStep = useProjectStore((s) => s.setInfoModalStep);
  const selectedPages = pages.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-sm text-neutral-300">
        캔버스에 바로 반영됩니다 — 헤드라인/서브헤드라인 문구와 스크린샷 이름을 여기서 바로 고칠 수 있어요.
      </p>
      <div className="flex flex-col gap-3">
        {selectedPages.map((page) => (
          <EditPageCard key={page.id} page={page} />
        ))}
      </div>
      <div className="flex justify-between">
        <Button onClick={() => setStep(1)}>이전</Button>
        <Button variant="primary" onClick={() => setStep(3)}>
          다음
        </Button>
      </div>
    </div>
  );
}

function CopyJsonStep() {
  const project = useProjectStore((s) => s.project);
  const pages = useProjectStore((s) => s.project.pages);
  const selectedIds = useProjectStore((s) => s.infoModalSelectedPageIds);
  const setStep = useProjectStore((s) => s.setInfoModalStep);
  const close = useProjectStore((s) => s.closeInfoModal);
  const pushToast = useToastStore((s) => s.push);
  const [copied, setCopied] = useState(false);

  const selectedPages = useMemo(() => pages.filter((p) => selectedIds.includes(p.id)), [pages, selectedIds]);
  const json = useMemo(() => buildScreenshotInfoJson(project, selectedPages), [project, selectedPages]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
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
        value={json}
        className="h-[45vh] w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-300 focus:outline-none"
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="flex justify-between">
        <Button onClick={() => setStep(2)}>이전</Button>
        <div className="flex gap-1.5">
          <Button onClick={close}>닫기</Button>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ScreenshotInfoModal() {
  const open = useProjectStore((s) => s.infoModalOpen);
  const step = useProjectStore((s) => s.infoModalStep);
  const close = useProjectStore((s) => s.closeInfoModal);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">Screenshot Info</h2>
          <button onClick={close} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>
        <StepHeader />
        <div className="flex-1 overflow-auto">
          {step === 1 && <PageSelectStep />}
          {step === 2 && <EditContentStep />}
          {step === 3 && <CopyJsonStep />}
        </div>
      </div>
    </div>
  );
}
