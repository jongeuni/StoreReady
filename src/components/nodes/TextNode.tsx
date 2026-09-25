import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import { Text } from 'react-konva';
import type Konva from 'konva';
import type { TextObject } from '../../types';
import { measureTextInk } from '../../utils/richText';

type Props = {
  obj: TextObject;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDblClick: () => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (attrs: { width: number; x: number; y: number; rotation: number }) => void;
  visible: boolean;
};

export const TextNode = forwardRef<Konva.Text, Props>(function TextNode(
  { obj, onSelect, onDblClick, onDragEnd, onTransformEnd, visible },
  ref,
) {
  const localRef = useRef<Konva.Text | null>(null);
  const setRefs = useCallback(
    (node: Konva.Text | null) => {
      localRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Selection outline / resize handles should hug the visible text, not the wide layout box.
  useLayoutEffect(() => {
    const node = localRef.current;
    if (!node) return;
    node.getSelfRect = () => {
      const ink = measureTextInk(obj);
      return { x: ink.offsetX, y: 0, width: ink.width, height: ink.height };
    };
  });

  return (
    <Text
      ref={setRefs}
      text={obj.text}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      fontSize={obj.fontSize}
      fontFamily={obj.fontFamily}
      fontStyle={String(obj.fontWeight)}
      fill={obj.color}
      align={obj.align}
      lineHeight={obj.lineHeight}
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
    />
  );
});
