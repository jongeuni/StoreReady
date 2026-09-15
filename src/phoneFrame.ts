// Shared geometry constants for the phone placeholder graphic, so every place that
// needs to know a phone object's rendered height (canvas drawing, alignment math,
// bounding-box calculations) agrees on the same aspect ratio.
export const PHONE_FRAME_ASPECT = 2.164; // height / width, modelled on a modern iPhone body
export const PHONE_CORNER_RADIUS_RATIO = 0.13; // relative to width
export const PHONE_SCREEN_INSET_RATIO = 0.035; // relative to width
export const PHONE_SCREEN_CORNER_RADIUS_RATIO = 0.105; // relative to width

export function phoneHeightForWidth(width: number): number {
  return Math.round(width * PHONE_FRAME_ASPECT);
}
