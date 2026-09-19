import { useMemo, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { buildScreenshotInfoJson } from '../utils/screenshotInfo';
import { Button } from './ui/Field';
import { useT } from '../i18n';
import type { Page } from '../types';

/** This page's JSON info (positions + copy), collapsed under the canvas — no wizard, no prompt, just this one page. */
export function PageInfoBar({ page }: { page: Page }) {
  const project = useProjectStore((s) => s.project);
  const pushToast = useToastStore((s) => s.push);
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const json = useMemo(() => buildScreenshotInfoJson(project, [page]), [project, page]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      pushToast(t('common.copyFailed'), 'error');
    }
  };

  return (
    <div className="shrink-0 border-t border-neutral-800 bg-neutral-900">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200"
      >
        <span className={`transition-transform ${expanded ? 'rotate-90' : ''}`}>▸</span>
        {t('info.title')}
        <span className="text-neutral-600">{t('info.hint')}</span>
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 px-3 pb-3">
          <textarea
            readOnly
            value={json}
            className="h-40 w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-2 font-mono text-xs leading-relaxed text-neutral-300 focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleCopy}>
              {copied ? t('common.copied') : t('info.copy')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
