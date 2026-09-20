import { useRef, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { TEMPLATES, type TemplateId } from '../templates';
import { Button } from './ui/Field';
import { ConfirmModal } from './ConfirmModal';
import type { AlignType } from '../utils/geometry';
import type { DeviceKind, Page } from '../types';
import { DEVICE_KIND_KEY, useT, type TKey } from '../i18n';

const ALIGN_H: { type: AlignType; key: TKey }[] = [
  { type: 'left', key: 'toolbar.alignLeft' },
  { type: 'center-h', key: 'toolbar.alignCenter' },
  { type: 'right', key: 'toolbar.alignRight' },
];
const ALIGN_V: { type: AlignType; key: TKey }[] = [
  { type: 'top', key: 'toolbar.alignTop' },
  { type: 'center-v', key: 'toolbar.alignMiddle' },
  { type: 'bottom', key: 'toolbar.alignBottom' },
];

const TEMPLATE_KEY: Record<TemplateId, TKey> = {
  blank: 'template.blank',
  'single-phone': 'template.single-phone',
  'dual-phone': 'template.dual-phone',
  'split-phone': 'template.split-phone',
};

const DEVICE_KINDS: DeviceKind[] = ['phone', 'tablet', 'watch'];

export function PageToolbar({ page }: { page: Page }) {
  const t = useT();
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
        <label className="text-xs text-neutral-500">{t('toolbar.template')}</label>
        <select
          ref={templateSelectRef}
          value={page.templateId ?? ''}
          onChange={(e) => requestApplyTemplate(e.target.value as TemplateId)}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100"
        >
          <option value="" disabled>
            {t('toolbar.applyTemplate')}
          </option>
          {TEMPLATES.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {t(TEMPLATE_KEY[tpl.id])}
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
          <option value="">{t('toolbar.addDevice')}</option>
          {DEVICE_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(DEVICE_KIND_KEY[k])}
            </option>
          ))}
        </select>
      </div>

      <div className={`flex items-center gap-1 ${hasSelection ? '' : 'pointer-events-none opacity-30'}`}>
        <span className="mr-1 text-xs text-neutral-500">{t('toolbar.align')}</span>
        {ALIGN_H.map((a) => (
          <button
            key={a.type}
            title={t(a.key)}
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
            title={t(a.key)}
            onClick={() => alignSelected(page.id, a.type)}
            className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-700"
          >
            {a.type === 'top' ? '⇞' : a.type === 'center-v' ? '↕' : '⇟'}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-neutral-700" />
        <Button variant="danger" onClick={() => removeSelectedObjects(page.id)}>
          {t('common.delete')}
        </Button>
      </div>

      {pendingTemplateId && (
        <ConfirmModal
          title={t('toolbar.confirmTitle')}
          message={t('toolbar.confirmMessage')}
          confirmLabel={t('toolbar.confirmApply')}
          cancelLabel={t('common.cancel')}
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
