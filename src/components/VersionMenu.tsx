import { useEffect, useRef, useState } from 'react';
import { MAX_VERSIONS, useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { useT } from '../i18n';
import { Button } from './ui/Field';
import { ConfirmModal } from './ConfirmModal';

/** Lists the project's versions (whole-file copies), switches between them, copies the open one, and exports all. */
export function VersionMenu({ onExportAll }: { onExportAll: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const project = useProjectStore((s) => s.project);
  const versionIds = useProjectStore((s) => s.versionIds);
  const parked = useProjectStore((s) => s.parked);
  const duplicateProject = useProjectStore((s) => s.duplicateProject);
  const switchProject = useProjectStore((s) => s.switchProject);
  const removeProject = useProjectStore((s) => s.removeProject);
  const pushToast = useToastStore((s) => s.push);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const nameOf = (id: string) => (id === project.id ? project.name : parked[id]?.project.name) || t('ver.untitled');
  const full = versionIds.length >= MAX_VERSIONS;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t('ver.title')}
        className="flex items-center gap-1.5 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200 hover:border-neutral-500"
      >
        {t('ver.title')}
        <span className="rounded bg-neutral-700 px-1.5 text-[10px] text-neutral-300">{versionIds.length}</span>
        <span className="text-[9px]">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-2xl">
          <p className="mb-2 text-[11px] leading-snug text-neutral-500">{t('ver.hint')}</p>

          <ul className="mb-3 flex max-h-56 flex-col gap-1 overflow-y-auto">
            {versionIds.map((id) => {
              const active = id === project.id;
              return (
                <li key={id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      switchProject(id);
                      setOpen(false);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                      active ? 'bg-blue-500/15 text-blue-200' : 'text-neutral-300 hover:bg-neutral-800'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? 'bg-blue-400' : 'bg-transparent'}`} />
                    <span className="truncate">{nameOf(id)}</span>
                  </button>
                  {versionIds.length > 1 && (
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                      onClick={() => setPendingDelete({ id, name: nameOf(id) })}
                      className="shrink-0 rounded px-1.5 py-1 text-sm leading-none text-neutral-500 hover:bg-neutral-800 hover:text-red-400"
                    >
                      ✕
                    </button>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1.5">
            <Button
              variant="primary"
              disabled={full}
              onClick={() => {
                duplicateProject();
                pushToast(t('ver.copied'), 'success');
                setOpen(false);
              }}
            >
              {t('ver.copy')}
            </Button>
            {full && <span className="text-[11px] text-neutral-500">{t('ver.limit', { max: MAX_VERSIONS })}</span>}
            <Button
              onClick={() => {
                setOpen(false);
                onExportAll();
              }}
            >
              {t('ver.exportAll')}
            </Button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <ConfirmModal
          title={t('ver.deleteTitle')}
          message={t('ver.deleteMessage', { name: pendingDelete.name })}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removeProject(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
