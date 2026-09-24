import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Circle, Group, Line, Rect, Text, Image as KonvaImage } from 'react-konva';
import type Konva from 'konva';
import type { Context } from 'konva/lib/Context';
import type { PhoneObject } from '../../types';
import { getDeviceModel } from '../../phoneFrame';
import { useHtmlImage } from '../../hooks/useHtmlImage';
import { useHtmlImages } from '../../hooks/useHtmlImages';
import {
  DEFAULT_DIVIDER_COLOR,
  bandCentroid,
  bandPolygon,
  dividerLines,
  dividerWidthOf,
  moveCut,
  resolveCuts,
} from '../../utils/diagonalSplit';
import { useT } from '../../i18n';
import { SRC_W, composeDevice3d } from '../../utils/device3d';
import { quadToUnitSquare, unitSquareToQuad, type Point } from '../../utils/perspectiveWarp';

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
  onDividerChange: (cuts: number[]) => void;
};

export const PhoneNode = forwardRef<Konva.Group, Props>(function PhoneNode(
  { obj, isSelected, onSelect, onDragEnd, onTransformEnd, onDividerChange },
  ref,
) {
  const t = useT();
  const groupRef = useRef<Konva.Group | null>(null);
  const setGroupRef = useCallback(
    (node: Konva.Group | null) => {
      groupRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const extra = obj.extraThemes ?? [];
  const themeImages = useHtmlImages([obj.image, ...extra.map((x) => x.image)]);
  const image = themeImages[0];
  const themeCount = 1 + extra.length;
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
    () =>
      r3d && frame3d
        ? composeDevice3d(
            r3d,
            frame3d,
            [
              { image: themeImages[0], name: obj.screenshotName || noName },
              ...extra.map((x, i) => ({ image: themeImages[i + 1], name: x.name || noName })),
            ],
            hint,
            {
              // Convert canvas px to the un-warped screen source scale (screen is ~60% of the frame image width).
              width: dividerWidthOf(obj),
              phoneWidth: obj.width,
              color: obj.dividerColor ?? DEFAULT_DIVIDER_COLOR,
              dashed: !!obj.dividerDashed,
              cuts: obj.dividerCuts,
            },
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [r3d, frame3d, themeImages, obj.width, obj.dividerWidth, obj.dividerColor, obj.dividerDashed, obj.dividerCuts, obj.screenshotName, extra.map((x) => x.name).join('|'), noName, hint],
  );

  // ---- Direct manipulation of the diagonal dividers (drag a line's handle on the canvas)
  const objRef = useRef(obj);
  objRef.current = obj;
  const sourceH = r3d ? Math.round(SRC_W * r3d.screenAspect) : 0;
  const quadPx = useMemo(
    () =>
      r3d ? (r3d.quad.map(([x, y]) => [x * r3d.frameWidth, y * r3d.frameHeight]) as [Point, Point, Point, Point]) : null,
    [r3d],
  );
  const toFrame = useMemo(() => (quadPx ? unitSquareToQuad(quadPx) : null), [quadPx]);
  const fromFrame = useMemo(() => (quadPx ? quadToUnitSquare(quadPx) : null), [quadPx]);

  const startDividerDrag = (index: number) => {
    const group = groupRef.current;
    const stage = group?.getStage();
    if (!group || !stage) return;
    const move = () => {
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const local = group.getAbsoluteTransform().copy().invert().point(pos);
      let fraction: number;
      if (r3d && fromFrame) {
        const [u, v] = fromFrame((local.x * r3d.frameWidth) / width, (local.y * r3d.frameHeight) / height);
        fraction = (u * SRC_W + v * sourceH) / (SRC_W + sourceH);
      } else {
        fraction = (local.x - insetSide + (local.y - insetTop)) / (screenW + screenH);
      }
      const cur = resolveCuts(1 + (objRef.current.extraThemes?.length ?? 0), objRef.current.dividerCuts);
      onDividerChange(moveCut(cur, index, fraction));
    };
    const stop = () => {
      stage.off('mousemove.dividerdrag touchmove.dividerdrag');
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
      stage.container().style.cursor = '';
    };
    stage.on('mousemove.dividerdrag touchmove.dividerdrag', move);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    stage.container().style.cursor = 'nwse-resize';
  };

  /** Handle + fat invisible hit line for each divider; `pts` are screen-space [x1, y1, x2, y2] in the given group's space. */
  const renderDividerHandles = (lines: [number, number, number, number][], scale = 1) => {
    if (!isSelected || themeCount < 2) return null;
    const handleR = Math.max(10, width * 0.028);
    return lines.map(([x1, y1, x2, y2], i) => {
      const mx = ((x1 + x2) / 2) * scale;
      const my = ((y1 + y2) / 2) * scale;
      const setCursor = (c: string) => (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.target.getStage()!.container().style.cursor = c;
      };
      const begin = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        e.cancelBubble = true; // don't let the phone's own drag start
        startDividerDrag(i);
      };
      return (
        <Group key={i}>
          <Line
            points={[x1 * scale, y1 * scale, x2 * scale, y2 * scale]}
            stroke="rgba(0,0,0,0.001)"
            strokeWidth={Math.max(24, width * 0.05)}
            onMouseEnter={setCursor('nwse-resize')}
            onMouseLeave={setCursor('')}
            onMouseDown={begin}
            onTouchStart={begin}
          />
          <Circle
            x={mx}
            y={my}
            radius={handleR}
            fill="#5b8def"
            stroke="#ffffff"
            strokeWidth={Math.max(2, width * 0.006)}
            onMouseEnter={setCursor('nwse-resize')}
            onMouseLeave={setCursor('')}
            onMouseDown={begin}
            onTouchStart={begin}
          />
        </Group>
      );
    });
  };

  const crop = image ? coverCrop(image.naturalWidth, image.naturalHeight, screenW, screenH) : null;

  if (r3d) {
    return (
      <Group
        ref={setGroupRef}
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
        {composite3d && <KonvaImage image={composite3d} width={width} height={height} />}
        {r3d &&
          toFrame &&
          renderDividerHandles(
            dividerLines(SRC_W, sourceH, themeCount, obj.dividerCuts).map(([x1, y1, x2, y2]) => {
              const a = toFrame(x1 / SRC_W, y1 / sourceH);
              const b = toFrame(x2 / SRC_W, y2 / sourceH);
              return [a[0], a[1], b[0], b[1]] as [number, number, number, number];
            }),
            width / r3d.frameWidth,
          )}
      </Group>
    );
  }

  return (
    <Group
      ref={setGroupRef}
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
        {themeCount > 1 ? (
          <>
            {Array.from({ length: themeCount }, (_, i) => {
              const poly = bandPolygon(screenW, screenH, themeCount, i, obj.dividerCuts);
              const img = themeImages[i];
              const themeName = (i === 0 ? obj.screenshotName : extra[i - 1]?.name) || t('canvas.noName');
              const [cx, cy] = bandCentroid(poly);
              return (
                <Group
                  key={i}
                  clipFunc={(ctx) => {
                    ctx.beginPath();
                    poly.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
                    ctx.closePath();
                  }}
                >
                  {img ? (
                    <KonvaImage
                      image={img}
                      width={screenW}
                      height={screenH}
                      crop={coverCrop(img.naturalWidth, img.naturalHeight, screenW, screenH)}
                    />
                  ) : (
                    <>
                      <Rect width={screenW} height={screenH} fill={i % 2 ? '#26262a' : '#1c1c1e'} />
                      <Text
                        text={themeName}
                        x={cx - width * 0.3}
                        y={cy - width * 0.03}
                        width={width * 0.6}
                        align="center"
                        fontSize={Math.max(14, width * 0.045)}
                        fontStyle="600"
                        fontFamily="system-ui, sans-serif"
                        fill="#8e8e93"
                        listening={false}
                      />
                    </>
                  )}
                </Group>
              );
            })}
            {dividerWidthOf(obj) > 0 &&
              dividerLines(screenW, screenH, themeCount, obj.dividerCuts).map((pts, i) => {
                const lw = dividerWidthOf(obj);
                return (
                  <Line
                    key={i}
                    points={pts}
                    stroke={obj.dividerColor ?? DEFAULT_DIVIDER_COLOR}
                    strokeWidth={lw}
                    dash={obj.dividerDashed ? [lw * 4, lw * 3] : undefined}
                    listening={false}
                  />
                );
              })}
          </>
        ) : image && crop ? (
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

      {/* Drag handles for the diagonal dividers (selected phone only) */}
      <Group x={insetSide} y={insetTop}>
        {renderDividerHandles(dividerLines(screenW, screenH, themeCount, obj.dividerCuts))}
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
