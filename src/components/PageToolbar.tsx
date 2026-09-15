import { useProjectStore } from '../store/useProjectStore';
import { TEMPLATES, type TemplateId } from '../templates';
import { Button } from './ui/Field';
import type { AlignType } from '../utils/geometry';
import type { Page } from '../types';

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

export function PageToolbar({ page }: { page: Page }) {
  const selectedObjectIds = useProjectStore((s) => s.selectedObjectIds);
  const alignSelected = useProjectStore((s) => s.alignSelected);
  const applyTemplate = useProjectStore((s) => s.applyTemplate);
  const openPromptModal = useProjectStore((s) => s.openPromptModal);
  const removeSelectedObjects = useProjectStore((s) => s.removeSelectedObjects);

  const hasSelection = selectedObjectIds.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500">Template</label>
        <select
          value={page.templateId ?? ''}
          onChange={(e) => applyTemplate(page.id, e.target.value as TemplateId)}
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

      <Button variant="primary" onClick={() => openPromptModal('page')}>
        Generate AI Prompt (this page)
      </Button>
    </div>
  );
}
