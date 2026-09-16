import { forwardRef } from 'react';
import { Ellipse, Group, Rect } from 'react-konva';
import type Konva from 'konva';
import type { ShapeObject } from '../../types';

type Props = {
  obj: ShapeObject;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (attrs: { width: number; height: number; left: number; top: number; rotation: number }) => void;
};

export const ShapeNode = forwardRef<Konva.Group, Props>(function ShapeNode({ obj, onSelect, onDragEnd, onTransformEnd }, ref) {
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
          width: Math.max(10, Math.round(obj.width * scaleX)),
          height: Math.max(10, Math.round(obj.height * scaleY)),
          left: Math.round(node.x()),
          top: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {obj.shapeKind === 'ellipse' ? (
        <Ellipse
          x={obj.width / 2}
          y={obj.height / 2}
          radiusX={obj.width / 2}
          radiusY={obj.height / 2}
          fill={obj.fill}
        />
      ) : (
        <Rect width={obj.width} height={obj.height} cornerRadius={obj.cornerRadius ?? 0} fill={obj.fill} />
      )}
    </Group>
  );
});
