import { forwardRef } from 'react';
import { Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import type { PhoneObject } from '../../types';
import {
  PHONE_CORNER_RADIUS_RATIO,
  PHONE_SCREEN_CORNER_RADIUS_RATIO,
  PHONE_SCREEN_INSET_RATIO,
  phoneHeightForWidth,
} from '../../phoneFrame';
import { useHtmlImage } from '../../hooks/useHtmlImage';

function roundedRectPath(ctx: Context, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
}

function coverCrop(imgW: number, imgH: number, boxW: number, boxH: number) {
  const imgRatio = imgW / imgH;
  const boxRatio = boxW / boxH;
  if (imgRatio > boxRatio) {
    const cropWidth = imgH * boxRatio;
    return { x: (imgW - cropWidth) / 2, y: 0, width: cropWidth, height: imgH };
  }
  const cropHeight = imgW / boxRatio;
  return { x: 0, y: (imgH - cropHeight) / 2, width: imgW, height: cropHeight };
}

type Props = {
  obj: PhoneObject;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onDragEnd: (x: number, y: number) => void;
  onTransformEnd: (attrs: { width: number; left: number; top: number; rotation: number }) => void;
};

export const PhoneNode = forwardRef<Konva.Group, Props>(function PhoneNode(
  { obj, isSelected, onSelect, onDragEnd, onTransformEnd },
  ref,
) {
  const image = useHtmlImage(obj.image);
  const width = obj.width;
  const height = phoneHeightForWidth(width);
  const bodyRadius = width * PHONE_CORNER_RADIUS_RATIO;
  const inset = width * PHONE_SCREEN_INSET_RATIO;
  const screenRadius = width * PHONE_SCREEN_CORNER_RADIUS_RATIO;
  const screenW = width - inset * 2;
  const screenH = height - inset * 2;
  const islandW = width * 0.28;
  const islandH = height * 0.013;

  const crop = image ? coverCrop(image.naturalWidth, image.naturalHeight, screenW, screenH) : null;

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
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd({
          width: Math.max(60, Math.round(width * scaleX)),
          left: Math.round(node.x()),
          top: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {/* Selection label */}
      <Text
        text={obj.screenshotName || '(unnamed)'}
        x={0}
        y={-Math.max(28, height * 0.028)}
        fontSize={Math.max(18, width * 0.045)}
        fontFamily="ui-monospace, monospace"
        fill={isSelected ? '#5b8def' : '#8a8a93'}
        listening={false}
      />

      {/* Phone body */}
      <Rect width={width} height={height} cornerRadius={bodyRadius} fill="#0a0a0c" stroke="#38383c" strokeWidth={1} />

      {/* Screen */}
      <Group
        x={inset}
        y={inset}
        clipFunc={(ctx) => roundedRectPath(ctx, screenW, screenH, screenRadius)}
      >
        {image && crop ? (
          <KonvaImage image={image} width={screenW} height={screenH} crop={crop} />
        ) : (
          <>
            <Rect width={screenW} height={screenH} fill="#1c1c1e" />
            <Text
              text={obj.screenshotName ? obj.screenshotName : 'No name set'}
              width={screenW}
              y={screenH / 2 - width * 0.09}
              align="center"
              fontSize={Math.max(16, width * 0.052)}
              fontStyle="600"
              fontFamily="system-ui, sans-serif"
              fill="#8e8e93"
            />
            <Text
              text="Upload a screenshot or generate an AI capture prompt"
              width={screenW * 0.82}
              x={screenW * 0.09}
              y={screenH / 2 + width * 0.01}
              align="center"
              fontSize={Math.max(12, width * 0.032)}
              fontFamily="system-ui, sans-serif"
              fill="#5b5b60"
            />
          </>
        )}
      </Group>

      {/* Dynamic island chrome, drawn on top for realism whether or not an image is set */}
      <Rect
        x={width / 2 - islandW / 2}
        y={inset + height * 0.018}
        width={islandW}
        height={islandH}
        cornerRadius={islandH / 2}
        fill="rgba(0,0,0,0.75)"
        listening={false}
      />
    </Group>
  );
});
