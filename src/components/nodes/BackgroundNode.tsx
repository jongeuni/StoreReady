import { Rect } from 'react-konva';
import type { Background } from '../../types';
import { gradientPoints } from '../../utils/gradient';

export function BackgroundNode({ width, height, background }: { width: number; height: number; background: Background }) {
  if (background.type === 'solid') {
    return <Rect x={0} y={0} width={width} height={height} fill={background.color} listening={false} />;
  }
  if (background.type === 'gradient') {
    const { start, end } = gradientPoints(width, height, background.angle);
    return (
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fillLinearGradientStartPoint={start}
        fillLinearGradientEndPoint={end}
        fillLinearGradientColorStops={[0, background.colors[0], 1, background.colors[1]]}
        listening={false}
      />
    );
  }
  // image background (reserved for a future premium tier)
  return <Rect x={0} y={0} width={width} height={height} fill="#000000" listening={false} />;
}
