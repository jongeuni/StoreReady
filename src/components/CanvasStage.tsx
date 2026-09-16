import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useProjectStore } from '../store/useProjectStore';
import type { Page, TextObject } from '../types';
import { BackgroundNode } from './nodes/BackgroundNode';
import { PhoneNode } from './nodes/PhoneNode';
import { TextNode } from './nodes/TextNode';
import { RichTextNode } from './nodes/RichTextNode';
import { ShapeNode } from './nodes/ShapeNode';
import { TextEditOverlay } from './TextEditOverlay';
import { runsHaveMultipleColors } from '../utils/richText';

type Props = {
  page: Page;
  stageRef: React.RefObject<Konva.Stage | null>;
};

const VIEWPORT_PADDING = 48;

export function CanvasStage({ page, stageRef }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewScale, setViewScale] = useState(0.2);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const selectedObjectIds = useProjectStore((s) => s.selectedObjectIds);
  const selectObject = useProjectStore((s) => s.selectObject);
  const clearSelection = useProjectStore((s) => s.clearSelection);
  const updateObject = useProjectStore((s) => s.updateObject);

  const nodeRefs = useRef(new Map<string, Konva.Node>());
  const transformerRef = useRef<Konva.Transformer>(null);

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const compute = () => {
      const availW = el.clientWidth - VIEWPORT_PADDING * 2;
      const availH = el.clientHeight - VIEWPORT_PADDING * 2;
      const scale = Math.max(0.05, Math.min(availW / page.canvas.width, availH / page.canvas.height, 1));
      setViewScale(scale);
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [page.canvas.width, page.canvas.height]);

  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (selectedObjectIds.length === 1) {
      const node = nodeRefs.current.get(selectedObjectIds[0]);
      const obj = page.objects.find((o) => o.id === selectedObjectIds[0]);
      if (node && obj) {
        tr.nodes([node]);
        tr.keepRatio(obj.type === 'phone');
        tr.rotateEnabled(true);
        tr.enabledAnchors(
          obj.type === 'phone'
            ? ['top-left', 'top-right', 'bottom-left', 'bottom-right']
            : obj.type === 'shape'
              ? ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']
              : ['middle-left', 'middle-right'],
        );
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
    tr.getLayer()?.batchDraw();
  }, [selectedObjectIds, page.objects]);

  const handleSelect = useCallback(
    (id: string) => (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const additive = 'shiftKey' in e.evt && e.evt.shiftKey;
      selectObject(id, additive);
    },
    [selectObject],
  );

  const displayWidth = page.canvas.width * viewScale;
  const displayHeight = page.canvas.height * viewScale;

  const editingObj = editingTextId
    ? (page.objects.find((o) => o.id === editingTextId) as TextObject | undefined)
    : undefined;

  return (
    <div
      ref={wrapperRef}
      className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-auto bg-neutral-900"
      style={{ padding: VIEWPORT_PADDING }}
    >
      <div
        className="relative shrink-0 shadow-2xl"
        style={{ width: displayWidth, height: displayHeight }}
        data-canvas-wrapper
      >
        <Stage
          ref={stageRef}
          width={displayWidth}
          height={displayHeight}
          scaleX={viewScale}
          scaleY={viewScale}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) clearSelection();
          }}
        >
          <Layer>
            <BackgroundNode width={page.canvas.width} height={page.canvas.height} background={page.canvas.background} />
            {[...page.objects]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((obj) => {
                const setRef = (node: Konva.Node | null) => {
                  if (node) nodeRefs.current.set(obj.id, node);
                  else nodeRefs.current.delete(obj.id);
                };

                if (obj.type === 'phone') {
                  return (
                    <PhoneNode
                      key={obj.id}
                      obj={obj}
                      isSelected={selectedObjectIds.includes(obj.id)}
                      ref={setRef}
                      onSelect={handleSelect(obj.id)}
                      onDragEnd={(x, y) => updateObject(page.id, obj.id, { left: Math.round(x), top: Math.round(y) })}
                      onTransformEnd={(attrs) => updateObject(page.id, obj.id, attrs)}
                    />
                  );
                }
                if (obj.type === 'shape') {
                  return (
                    <ShapeNode
                      key={obj.id}
                      obj={obj}
                      ref={setRef}
                      onSelect={handleSelect(obj.id)}
                      onDragEnd={(x, y) => updateObject(page.id, obj.id, { left: Math.round(x), top: Math.round(y) })}
                      onTransformEnd={(attrs) => updateObject(page.id, obj.id, attrs)}
                    />
                  );
                }
                if (runsHaveMultipleColors(obj.runs)) {
                  return (
                    <RichTextNode
                      key={obj.id}
                      obj={obj}
                      visible={obj.id !== editingTextId}
                      ref={setRef}
                      onSelect={handleSelect(obj.id)}
                      onDblClick={() => setEditingTextId(obj.id)}
                      onDragEnd={(x, y) => updateObject(page.id, obj.id, { x: Math.round(x), y: Math.round(y) })}
                      onTransformEnd={(attrs) => updateObject(page.id, obj.id, attrs)}
                    />
                  );
                }
                return (
                  <TextNode
                    key={obj.id}
                    obj={obj}
                    visible={obj.id !== editingTextId}
                    ref={setRef}
                    onSelect={handleSelect(obj.id)}
                    onDblClick={() => setEditingTextId(obj.id)}
                    onDragEnd={(x, y) => updateObject(page.id, obj.id, { x: Math.round(x), y: Math.round(y) })}
                    onTransformEnd={(attrs) => updateObject(page.id, obj.id, attrs)}
                  />
                );
              })}
            <Transformer
              ref={transformerRef}
              rotateAnchorOffset={24}
              borderStroke="#5b8def"
              anchorStroke="#5b8def"
              anchorFill="#ffffff"
              anchorSize={10}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 30 || newBox.height < 20 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>

        {editingObj && (
          <TextEditOverlay
            obj={editingObj}
            viewScale={viewScale}
            onCancel={() => setEditingTextId(null)}
            onCommit={(patch) => {
              updateObject(page.id, editingObj.id, patch);
              setEditingTextId(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
