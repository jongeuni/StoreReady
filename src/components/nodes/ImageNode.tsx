import { forwardRef } from 'react';
import { Group, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import type { ImageObject } from '../../types';
import { useHtmlImage } from '../../hooks/useHtmlImage';

type Props = {
  obj: ImageObject;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (attrs: { width: number; height: number; left: number; top: number; rotation: number }) => void;
};

function roundedRectPath(ctx: Context, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
}

export const ImageNode = forwardRef<Konva.Group, Props>(function ImageNode({ obj, onSelect, onDragEnd, onTransformEnd }, ref) {
  const image = useHtmlImage(obj.image);
  const radius = Math.min(obj.cornerRadius ?? 0, obj.width / 2, obj.height / 2);

  return (
    <Group
      ref={ref}
      x={obj.left}
      y={obj.top}
      rotation={obj.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd({
          width: Math.max(20, Math.round(obj.width * scaleX)),
          height: Math.max(20, Math.round(obj.height * scaleY)),
          left: Math.round(node.x()),
          top: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
        });
      }}
      clipFunc={radius > 0 ? (ctx) => roundedRectPath(ctx, obj.width, obj.height, radius) : undefined}
    >
      {image && <KonvaImage image={image} width={obj.width} height={obj.height} />}
    </Group>
  );
});
