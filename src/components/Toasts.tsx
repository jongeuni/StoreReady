import { useToastStore } from '../store/useToastStore';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto max-w-sm cursor-pointer rounded-lg border px-3 py-2 text-sm shadow-lg ${
            t.tone === 'error'
              ? 'border-red-800 bg-red-950 text-red-200'
              : t.tone === 'success'
                ? 'border-emerald-800 bg-emerald-950 text-emerald-200'
                : 'border-neutral-700 bg-neutral-800 text-neutral-100'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
