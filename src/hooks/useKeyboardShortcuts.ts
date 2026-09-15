import { useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';

const STEP_SMALL = 1;
const STEP_LARGE = 10;

export function useKeyboardShortcuts(pageId: string) {
  useEffect(() => {
    function isEditingText(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return el?.tagName === 'INPUT' || el?.tagName === 'TEXTAREA' || el?.isContentEditable;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isEditingText(e.target)) return;
      const { selectedObjectIds, clearSelection, removeSelectedObjects, duplicateObject, moveObjectBy } =
        useProjectStore.getState();

      if (e.key === 'Escape') {
        clearSelection();
        return;
      }
      if (selectedObjectIds.length === 0) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeSelectedObjects(pageId);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        selectedObjectIds.forEach((id) => duplicateObject(pageId, id));
        return;
      }
      const step = e.shiftKey ? STEP_LARGE : STEP_SMALL;
      const deltas: Record<string, [number, number]> = {
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
      };
      const delta = deltas[e.key];
      if (delta) {
        e.preventDefault();
        selectedObjectIds.forEach((id) => moveObjectBy(pageId, id, delta[0], delta[1]));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pageId]);
}
