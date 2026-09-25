import { useEffect } from 'react';

// Canvas nodes that load pictures asynchronously (screenshots, free images, the baked 3D phone frame)
// register here while they are not ready to draw. Exports wait for this to drain, so a page is never
// captured with a blank phone or a missing picture.
const pending = new Set<string>();

/** Marks `id` as "still loading" for as long as `isPending` is true. */
export function usePendingRender(id: string, isPending: boolean) {
  useEffect(() => {
    if (isPending) pending.add(id);
    return () => {
      pending.delete(id);
    };
  }, [id, isPending]);
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Resolves once React has re-rendered and every registered node has finished loading (or after `maxMs`). */
export async function waitForRender(maxMs = 10000): Promise<void> {
  await frame();
  await frame();
  const started = Date.now();
  while (pending.size > 0 && Date.now() - started < maxMs) await sleep(40);
  await frame();
}
