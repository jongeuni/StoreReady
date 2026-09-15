import { useMemo, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { generateFullProjectPrompt, generatePagePrompt } from '../utils/promptGenerator';
import { Button } from './ui/Field';

export function PromptModal() {
  const open = useProjectStore((s) => s.promptModalOpen);
  const scope = useProjectStore((s) => s.promptModalScope);
  const close = useProjectStore((s) => s.closePromptModal);
  const project = useProjectStore((s) => s.project);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const pushToast = useToastStore((s) => s.push);
  const [copied, setCopied] = useState(false);

  const currentPage = project.pages.find((p) => p.id === currentPageId);

  const promptText = useMemo(() => {
    if (!open) return '';
    if (scope === 'all') return generateFullProjectPrompt(project);
    if (currentPage) return generatePagePrompt(project, currentPage);
    return '';
  }, [open, scope, project, currentPage]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      pushToast('Could not copy to clipboard. Select the text and copy it manually.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-neutral-100">
            {scope === 'all' ? `AI Capture Prompt — All ${project.pages.length} pages` : `AI Capture Prompt — ${currentPage?.label ?? ''}`}
          </h2>
          <button onClick={close} className="text-neutral-500 hover:text-neutral-200">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <textarea
            readOnly
            value={promptText}
            className="h-[50vh] w-full resize-none rounded border border-neutral-700 bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-300 focus:outline-none"
            onFocus={(e) => e.currentTarget.select()}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-neutral-800 px-4 py-3">
          <p className="text-[11px] text-neutral-500">Paste this into Claude Code, Cursor, or any AI coding agent working in your app's repo.</p>
          <Button variant="primary" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy Prompt'}
          </Button>
        </div>
      </div>
    </div>
  );
}
