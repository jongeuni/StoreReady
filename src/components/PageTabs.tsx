import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { Button } from './ui/Field';

export function PageTabs() {
  const pages = useProjectStore((s) => s.project.pages);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const selectPage = useProjectStore((s) => s.selectPage);
  const addPage = useProjectStore((s) => s.addPage);
  const removePage = useProjectStore((s) => s.removePage);
  const duplicatePage = useProjectStore((s) => s.duplicatePage);
  const renamePage = useProjectStore((s) => s.renamePage);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-800 bg-neutral-900 px-3 py-2">
      {pages.map((page, i) => (
        <div
          key={page.id}
          onClick={() => selectPage(page.id)}
          className={`group flex shrink-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
            page.id === currentPageId
              ? 'border-blue-500 bg-blue-500/10 text-blue-200'
              : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
          }`}
        >
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
          <span className="hidden gap-1 group-hover:flex">
            <button
              title="Duplicate page"
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
                title="Delete page"
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(page.id);
                }}
                className="text-neutral-500 hover:text-red-400"
              >
                ✕
              </button>
            )}
          </span>
        </div>
      ))}
      <Button onClick={() => addPage()}>+ Page</Button>
    </div>
  );
}
