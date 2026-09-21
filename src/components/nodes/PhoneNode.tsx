import { forwardRef, useMemo } from 'react';
import { Circle, Group, Rect, Text, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import type { PhoneObject } from '../../types';
import { getDeviceModel } from '../../phoneFrame';
import { useHtmlImage } from '../../hooks/useHtmlImage';
import { useT } from '../../i18n';
import { composeDevice3d } from '../../utils/device3d';

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
  const t = useT();
  const image = useHtmlImage(obj.image);
  const deviceKind = obj.deviceKind ?? 'phone';
  const model = getDeviceModel(obj.deviceModel, deviceKind);
  const width = obj.width;
  const height = Math.round(width * model.aspect);
  const bodyRadius = width * model.cornerRadiusRatio;
  const insetTop = width * model.screenInsetRatio;
  const insetSide = width * model.screenInsetRatio;
  const insetBottom = width * model.screenInsetBottomRatio;
  const screenRadius = width * model.screenCornerRadiusRatio;
  const screenW = width - insetSide * 2;
  const screenH = height - insetTop - insetBottom;
  const islandW = width * 0.28;
  const islandH = height * 0.013;
  const crownW = width * 0.05;
  const crownH = height * 0.14;
  const homeButtonRadius = width * 0.055;

  const r3d = model.render3d;
  const frame3d = useHtmlImage(r3d?.frameUrl);
  const noName = t('canvas.noName');
  const hint = t('canvas.placeholder');
  const composite3d = useMemo(
    () => (r3d && frame3d ? composeDevice3d(r3d, frame3d, image, obj.screenshotName || noName, hint) : null),
    [r3d, frame3d, image, obj.screenshotName, noName, hint],
  );

  const crop = image ? coverCrop(image.naturalWidth, image.naturalHeight, screenW, screenH) : null;

  if (r3d) {
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
            width: Math.max(40, Math.round(width * scaleX)),
            left: Math.round(node.x()),
            top: Math.round(node.y()),
            rotation: Math.round(node.rotation()),
          });
        }}
      >
        <Text
          text={obj.screenshotName || t('canvas.unnamed')}
          x={0}
          y={-Math.max(28, height * 0.028)}
          fontSize={Math.max(18, width * 0.045)}
          fontFamily="ui-monospace, monospace"
          fill={isSelected ? '#5b8def' : '#8a8a93'}
          listening={false}
        />
        {composite3d && <KonvaImage image={composite3d} width={width} height={height} />}
      </Group>
    );
  }

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
          width: Math.max(40, Math.round(width * scaleX)),
          left: Math.round(node.x()),
          top: Math.round(node.y()),
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {/* Selection label */}
      <Text
        text={obj.screenshotName || t('canvas.unnamed')}
        x={0}
        y={-Math.max(28, height * 0.028)}
        fontSize={Math.max(18, width * 0.045)}
        fontFamily="ui-monospace, monospace"
        fill={isSelected ? '#5b8def' : '#8a8a93'}
        listening={false}
      />

      {/* Device body */}
      <Rect width={width} height={height} cornerRadius={bodyRadius} fill="#0a0a0c" stroke="#38383c" strokeWidth={1} />

      {/* Digital crown (watch only) */}
      {model.chrome === 'crown' && (
        <Rect
          x={width - 1}
          y={height / 2 - crownH / 2}
          width={crownW}
          height={crownH}
          cornerRadius={crownW / 2}
          fill="#0a0a0c"
          stroke="#38383c"
          strokeWidth={1}
        />
      )}

      {/* Screen */}
      <Group x={insetSide} y={insetTop} clipFunc={(ctx) => roundedRectPath(ctx, screenW, screenH, screenRadius)}>
        {image && crop ? (
          <KonvaImage image={image} width={screenW} height={screenH} crop={crop} />
        ) : (
          <>
            <Rect width={screenW} height={screenH} fill="#1c1c1e" />
            <Text
              text={obj.screenshotName ? obj.screenshotName : t('canvas.noName')}
              width={screenW}
              y={screenH / 2 - width * 0.09}
              align="center"
              fontSize={Math.max(16, width * 0.052)}
              fontStyle="600"
              fontFamily="system-ui, sans-serif"
              fill="#8e8e93"
            />
            <Text
              text={t('canvas.placeholder')}
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

      {/* Dynamic island (Face ID phones), drawn on top for realism whether or not an image is set */}
      {model.chrome === 'island' && (
        <Rect
          x={width / 2 - islandW / 2}
          y={insetTop + height * 0.018}
          width={islandW}
          height={islandH}
          cornerRadius={islandH / 2}
          fill="rgba(0,0,0,0.75)"
          listening={false}
        />
      )}

      {/* Home button (iPhone SE-style phones), centered in the bottom bezel */}
      {model.chrome === 'homeButton' && (
        <Circle
          x={width / 2}
          y={height - insetBottom / 2}
          radius={homeButtonRadius}
          stroke="#38383c"
          strokeWidth={Math.max(1, width * 0.006)}
          listening={false}
        />
      )}
    </Group>
  );
});
