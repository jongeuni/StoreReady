// Converts a CSS-style angle (0deg = bottom-to-top... we use 0deg = left-to-right,
// clockwise, matching typical design-tool gradient angle dials) into start/end points
// for Konva's fillLinearGradientStartPoint/EndPoint, given a box size.
export function gradientPoints(width: number, height: number, angleDeg: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  // Project the box's half-diagonal onto the gradient direction so the line always
  // spans the full box regardless of angle.
  const len = Math.abs(dx) * width + Math.abs(dy) * height;
  const half = len / 2;
  return {
    start: { x: cx - dx * half, y: cy - dy * half },
    end: { x: cx + dx * half, y: cy + dy * half },
  };
}
