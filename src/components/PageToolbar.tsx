import { useRef, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { TEMPLATES, type TemplateId } from '../templates';
import { Button } from './ui/Field';
import { ConfirmModal } from './ConfirmModal';
import type { AlignType } from '../utils/geometry';
import type { DeviceKind, Page } from '../types';
import { DEVICE_KIND_LABELS } from '../phoneFrame';

const ALIGN_H: { type: AlignType; label: string }[] = [
  { type: 'left', label: 'Align left' },
  { type: 'center-h', label: 'Align center' },
  { type: 'right', label: 'Align right' },
];
const ALIGN_V: { type: AlignType; label: string }[] = [
  { type: 'top', label: 'Align top' },
  { type: 'center-v', label: 'Align middle' },
  { type: 'bottom', label: 'Align bottom' },
];

const DEVICE_KINDS: DeviceKind[] = ['phone', 'tablet', 'watch'];

export function PageToolbar({ page }: { page: Page }) {
  const selectedObjectIds = useProjectStore((s) => s.selectedObjectIds);
  const alignSelected = useProjectStore((s) => s.alignSelected);
  const applyTemplate = useProjectStore((s) => s.applyTemplate);
  const addPhoneObject = useProjectStore((s) => s.addPhoneObject);
  const removeSelectedObjects = useProjectStore((s) => s.removeSelectedObjects);

  const [pendingTemplateId, setPendingTemplateId] = useState<TemplateId | null>(null);
  const templateSelectRef = useRef<HTMLSelectElement>(null);
  const deviceSelectRef = useRef<HTMLSelectElement>(null);

  const hasSelection = selectedObjectIds.length > 0;

  const requestApplyTemplate = (templateId: TemplateId) => {
    if (page.objects.length === 0) {
      applyTemplate(page.id, templateId);
      return;
    }
    setPendingTemplateId(templateId);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500">Template</label>
        <select
          ref={templateSelectRef}
          value={page.templateId ?? ''}
          onChange={(e) => requestApplyTemplate(e.target.value as TemplateId)}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100"
        >
          <option value="" disabled>
            Apply template…
          </option>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>

        <span className="mx-1 h-4 w-px bg-neutral-700" />

        <select
          ref={deviceSelectRef}
          value=""
          onChange={(e) => {
            const kind = e.target.value as DeviceKind;
            if (!kind) return;
            addPhoneObject(page.id, kind);
            if (deviceSelectRef.current) deviceSelectRef.current.value = '';
          }}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100"
        >
          <option value="">+ 기기 추가…</option>
          {DEVICE_KINDS.map((k) => (
            <option key={k} value={k}>
              {DEVICE_KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className={`flex items-center gap-1 ${hasSelection ? '' : 'pointer-events-none opacity-30'}`}>
        <span className="mr-1 text-xs text-neutral-500">Align</span>
        {ALIGN_H.map((a) => (
          <button
            key={a.type}
            title={a.label}
            onClick={() => alignSelected(page.id, a.type)}
            className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
          >
            {a.type === 'left' ? '⇤' : a.type === 'center-h' ? '↔' : '⇥'}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-700" />
        {ALIGN_V.map((a) => (
          <button
            key={a.type}
            title={a.label}
            onClick={() => alignSelected(page.id, a.type)}
            className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
          >
            {a.type === 'top' ? '⇞' : a.type === 'center-v' ? '↕' : '⇟'}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-700" />
        <Button variant="danger" onClick={() => removeSelectedObjects(page.id)}>
          Delete
        </Button>
      </div>

      {pendingTemplateId && (
        <ConfirmModal
          title="템플릿을 적용할까요?"
          message="템플릿을 적용하면 현재 페이지의 내용이 모두 사라집니다. 계속할까요?"
          confirmLabel="적용"
          cancelLabel="취소"
          onCancel={() => {
            if (templateSelectRef.current) templateSelectRef.current.value = page.templateId ?? '';
            setPendingTemplateId(null);
          }}
          onConfirm={() => {
            applyTemplate(page.id, pendingTemplateId);
            setPendingTemplateId(null);
          }}
        />
      )}
    </div>
  );
}
