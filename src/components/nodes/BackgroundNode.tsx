import { Rect } from 'react-konva';
import type { Background } from '../../types';
import { gradientPoints } from '../../utils/gradient';

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const safe = (c: string | undefined, fallback: string) => (c && HEX_RE.test(c.trim()) ? c.trim() : fallback);

export function BackgroundNode({ width, height, background }: { width: number; height: number; background: Background }) {
  if (background.type === 'solid') {
    return <Rect x={0} y={0} width={width} height={height} fill={safe(background.color, '#000000')} listening={false} />;
  }
  if (background.type === 'gradient') {
    const { start, end } = gradientPoints(width, height, background.angle);
    const c0 = safe(background.colors[0], '#000000');
    const c1 = safe(background.colors[1], c0);
    return (
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fillLinearGradientStartPoint={start}
        fillLinearGradientEndPoint={end}
        fillLinearGradientColorStops={[0, c0, 1, c1]}
        listening={false}
      />
    );
  }
  // image background (reserved for a future premium tier)
  return <Rect x={0} y={0} width={width} height={height} fill="#000000" listening={false} />;
}
