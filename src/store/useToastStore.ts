import { create } from 'zustand';

type Toast = { id: string; message: string; tone: 'error' | 'success' | 'info' };

type ToastState = {
  toasts: Toast[];
  push: (message: string, tone?: Toast['tone']) => void;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'info') =>
    set((s) => {
      const id = Math.random().toString(36).slice(2);
      setTimeout(() => {
        useToastStore.getState().dismiss(id);
      }, 4000);
      return { toasts: [...s.toasts, { id, message, tone }] };
    }),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
