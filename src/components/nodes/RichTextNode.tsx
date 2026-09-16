import { forwardRef, useMemo } from 'react';
import { Shape } from 'react-konva';
import type Konva from 'konva';
import type { TextObject } from '../../types';
import { layoutRichText } from '../../utils/richText';

type Props = {
  obj: TextObject;
  visible: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDblClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (attrs: { width: number; x: number; y: number; rotation: number }) => void;
};

export const RichTextNode = forwardRef<Konva.Shape, Props>(function RichTextNode(
  { obj, visible, onSelect, onDblClick, onDragEnd, onTransformEnd },
  ref,
) {
  const layout = useMemo(
    () =>
      layoutRichText(obj.runs!, {
        fontFamily: obj.fontFamily,
        fontSize: obj.fontSize,
        fontWeight: obj.fontWeight,
        maxWidth: obj.width,
        align: obj.align,
        lineHeight: obj.lineHeight,
      }),
    [obj.runs, obj.fontFamily, obj.fontSize, obj.fontWeight, obj.width, obj.align, obj.lineHeight],
  );

  return (
    <Shape
      ref={ref}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={Math.max(layout.totalHeight, obj.fontSize)}
      rotation={obj.rotation}
      visible={visible}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDblTap={onDblClick}
      onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd({
          width: Math.max(40, Math.round(obj.width * scaleX)),
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
        });
      }}
      sceneFunc={(ctx) => {
        ctx.font = `${obj.fontWeight} ${obj.fontSize}px ${obj.fontFamily}`;
        ctx.textBaseline = 'top';
        for (const line of layout.lines) {
          for (const seg of line.segments) {
            ctx.fillStyle = seg.color;
            ctx.fillText(seg.text, seg.x, line.y);
          }
        }
      }}
      hitFunc={(ctx, shape) => {
        // A custom sceneFunc draws no fillable path of its own, so Konva needs an explicit hit
        // region (the full declared box) to keep click/drag/select working across the whole node.
        ctx.beginPath();
        ctx.rect(0, 0, shape.width(), shape.height());
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
});
