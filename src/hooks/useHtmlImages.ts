import { useEffect, useMemo, useState } from 'react';

/** Loads several image sources at once; each slot is undefined until its image has loaded. */
export function useHtmlImages(srcs: (string | undefined)[]): (HTMLImageElement | undefined)[] {
  // Data URLs never contain a space, so it is a safe separator for the change-detection key.
  const key = srcs.map((s) => s ?? '').join(' ');
  const [images, setImages] = useState<(HTMLImageElement | undefined)[]>([]);

  useEffect(() => {
    let cancelled = false;
    const list = key.split(' ');
    setImages(list.map(() => undefined));
    list.forEach((src, i) => {
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        setImages((prev) => {
          const next = prev.slice();
          next[i] = img;
          return next;
        });
      };
      img.src = src;
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Stable identity until an image (or the source list) changes, so it can be a memo dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => key.split(' ').map((_, i) => images[i]), [images, key]);
}
