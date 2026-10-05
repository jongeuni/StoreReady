import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Button } from './ui/Field';
import { useT } from '../i18n';
import { ConfirmModal } from './ConfirmModal';

const PAGE_DRAG_TYPE = 'application/x-storeready-page';

export function PageTabs() {
  const pages = useProjectStore((s) => s.project.pages);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const selectPage = useProjectStore((s) => s.selectPage);
  const addPage = useProjectStore((s) => s.addPage);
  const removePage = useProjectStore((s) => s.removePage);
  const duplicatePage = useProjectStore((s) => s.duplicatePage);
  const renamePage = useProjectStore((s) => s.renamePage);
  const reorderPage = useProjectStore((s) => s.reorderPage);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Drag-to-reorder: which tab is being dragged, and the gap (0..pages.length) it would be dropped into.
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropGap, setDropGap] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; label: string } | null>(null);
  const t = useT();

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      {pages.map((page, i) => (
        <div
          key={page.id}
          onClick={() => selectPage(page.id)}
          draggable={editingId !== page.id}
          onDragStart={(e) => {
            e.dataTransfer.setData(PAGE_DRAG_TYPE, page.id);
            e.dataTransfer.effectAllowed = 'move';
            setDragId(page.id);
          }}
          onDragEnd={() => {
            setDragId(null);
            setDropGap(null);
          }}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            // Left half of a tab = drop before it, right half = drop after it.
            const rect = e.currentTarget.getBoundingClientRect();
            const gap = e.clientX < rect.left + rect.width / 2 ? i : i + 1;
            if (gap !== dropGap) setDropGap(gap);
          }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData(PAGE_DRAG_TYPE);
            const gap = dropGap ?? i;
            setDragId(null);
            setDropGap(null);
            if (!id) return;
            const from = pages.findIndex((p) => p.id === id);
            if (from === -1) return;
            // The gap index counts the dragged tab itself; moving it forward shifts everything one slot left.
            reorderPage(id, from < gap ? gap - 1 : gap);
          }}
          className={`relative flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
            dragId === page.id ? 'opacity-40' : ''
          } ${
            page.id === currentPageId
              ? 'border-blue-500 bg-blue-500/10 text-blue-200'
              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
          }`}
        >
          {dragId && dropGap === i && (
            <span className="pointer-events-none absolute -left-[7px] inset-y-0 w-[3px] rounded bg-blue-400" />
          )}
          {dragId && dropGap === pages.length && i === pages.length - 1 && (
            <span className="pointer-events-none absolute -right-[7px] inset-y-0 w-[3px] rounded bg-blue-400" />
          )}
          {editingId === page.id ? (
            <input
              autoFocus
              defaultValue={page.label}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                renamePage(page.id, e.currentTarget.value || page.label);
                setEditingId(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="w-24 rounded border border-neutral-600 bg-neutral-800 px-1 text-xs text-neutral-100"
            />
          ) : (
            <span onDoubleClick={() => setEditingId(page.id)}>
              {i + 1}. {page.label}
            </span>
          )}
          <span className="flex gap-1">
            <button
              title={t('tabs.duplicate')}
              onClick={(e) => {
                e.stopPropagation();
                duplicatePage(page.id);
              }}
              className="text-neutral-500 hover:text-neutral-200"
            >
              ⧉
            </button>
            {pages.length > 1 && (
              <button
                title={t('tabs.delete')}
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete({ id: page.id, label: page.label });
                }}
                className="text-neutral-500 hover:text-red-400"
              >
                ✕
              </button>
            )}
          </span>
        </div>
      ))}
      <Button onClick={() => addPage()}>{t('tabs.addPage')}</Button>

      {pendingDelete && (
        <ConfirmModal
          title={t('tabs.deleteConfirmTitle')}
          message={t('tabs.deleteConfirmMessage', { name: pendingDelete.label })}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            removePage(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
