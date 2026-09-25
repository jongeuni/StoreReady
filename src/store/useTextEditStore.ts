import { create } from 'zustand';

// While a text object is being edited on the canvas (TextEditOverlay mounted), it registers
// a handler here so the Properties Panel's existing Color field can apply a color to whatever
// range is currently drag-selected inside the editor, instead of recoloring the whole object.
type TextEditState = {
  applyColorToSelection: ((color: string) => void) | null;
  setApplyColorToSelection: (fn: ((color: string) => void) | null) => void;
  /** Commits (saves and closes) the text edit in progress, if any. */
  commitEdit: (() => void) | null;
  setCommitEdit: (fn: (() => void) | null) => void;
};

export const useTextEditStore = create<TextEditState>((set) => ({
  applyColorToSelection: null,
  setApplyColorToSelection: (fn) => set({ applyColorToSelection: fn }),
  commitEdit: null,
  setCommitEdit: (fn) => set({ commitEdit: fn }),
}));
