import { useT } from '../i18n';
import { Button } from './ui/Field';

type Props = {
  name: string;
  images: string[];
  onClose: () => void;
};

/** An App Store product-page look-alike showing the project's finished pages in order. */
export function PreviewModal({ name, images, onClose }: Props) {
  const t = useT();
  const title = name.trim() || 'Your App';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col gap-4 overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lime-400">
            <span className="text-xl font-black text-neutral-950">{title.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-semibold text-neutral-50">{title}</div>
            <div className="text-xs text-neutral-500">{t('preview.title')}</div>
          </div>
          <span className="rounded-full bg-blue-600 px-5 py-1.5 text-sm font-bold text-white">GET</span>
          <Button onClick={onClose}>{t('common.close')}</Button>
        </div>

        <div className="flex snap-x gap-3 overflow-x-auto pb-2">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              draggable={false}
              className="snap-start rounded-2xl border border-neutral-800 object-contain"
              style={{ height: '62vh', width: 'auto', maxWidth: 'none' }}
            />
          ))}
        </div>

        <p className="text-center text-[11px] text-neutral-500">{t('preview.hint')}</p>
      </div>
    </div>
  );
}
