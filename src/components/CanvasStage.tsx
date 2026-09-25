import { panelWidthOf, spreadGap } from '../utils/spread';
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { Stage, Layer, Transformer } from 'react-konva';
import type Konva from 'konva';
import { useProjectStore } from '../store/useProjectStore';
import type { Page, TextObject } from '../types';
import { BackgroundNode } from './nodes/BackgroundNode';
import { PhoneNode } from './nodes/PhoneNode';
import { TextNode } from './nodes/TextNode';
import { RichTextNode } from './nodes/RichTextNode';
import { ImageNode } from './nodes/ImageNode';
import { ShapeNode } from './nodes/ShapeNode';
import { TextEditOverlay } from './TextEditOverlay';
import { runsHaveMultipleColors } from '../utils/richText';
import { useTextEditStore } from '../store/useTextEditStore';
import { useToastStore } from '../store/useToastStore';
import { useT } from '../i18n';
import { readImageFile } from '../utils/imageUpload';
import { getObjectBBox } from '../utils/geometry';

type Props = {
  page: Page;
  stageRef: React.RefObject<Konva.Stage | null>;
};

const VIEWPORT_PADDING = 48;

export function CanvasStage({ page, stageRef }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [viewScale, setViewScale] = useState(0.2);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const canvasBoxRef = useRef<HTMLDivElement>(null);
  const t = useT();
  const pushToast = useToastStore((s) => s.push);
  const addImageObject = useProjectStore((s) => s.addImageObject);
  const addScreenshotToPhone = useProjectStore((s) => s.addScreenshotToPhone);

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
        tr.keepRatio(obj.type === 'phone' || obj.type === 'image');
        tr.rotateEnabled(true);
        // Text's selection box hugs the visible glyphs (see measureTextInk); a hair of padding keeps it readable.
        // Other object types keep a flush, exact-fit outline.
        tr.padding(obj.type === 'text' ? Math.max(2, Math.round(obj.fontSize * 0.05)) : 0);
        tr.enabledAnchors(
          obj.type === 'phone' || obj.type === 'image'
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

  /** The phone under a client-space point (topmost first), or null. */
  const phoneAtPoint = (clientX: number, clientY: number): string | null => {
    const rect = canvasBoxRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / viewScale;
    const y = (clientY - rect.top) / viewScale;
    const phones = page.objects.filter((o) => o.type === 'phone').sort((a, b) => b.zIndex - a.zIndex);
    const hit = phones.find((o) => {
      const b = getObjectBBox(o);
      return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
    });
    return hit ? hit.id : null;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(null);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const targetId = phoneAtPoint(e.clientX, e.clientY);
    for (const file of files) {
      const result = await readImageFile(file);
      if (!result.ok) {
        pushToast(t(result.errorKey, result.errorVars), 'error');
        continue;
      }
      if (targetId) {
        addScreenshotToPhone(page.id, targetId, result.dataUrl, file.name);
      } else {
        // Dropped on empty canvas: place it as a free picture.
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            addImageObject(page.id, result.dataUrl, file.name, img.naturalWidth, img.naturalHeight);
            resolve();
          };
          img.onerror = () => {
            pushToast(t('upload.errRead'), 'error');
            resolve();
          };
          img.src = result.dataUrl;
        });
      }
    }
  };

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
      onMouseDownCapture={(e) => {
        // Any click on the canvas area finishes an in-progress text edit (keeping what was typed / recolored).
        if (editingTextId && !(e.target as HTMLElement).closest('[data-text-editor]')) {
          useTextEditStore.getState().commitEdit?.();
        }
      }}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        const id = phoneAtPoint(e.clientX, e.clientY);
        if (id !== dropTargetId) setDropTargetId(id);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDropTargetId(null);
      }}
      onDrop={handleDrop}
      onMouseDown={(e) => {
        // Clicking the empty area around the page behaves like clicking the page background:
        // deselect, so the "add to page" / background panel shows.
        if (e.target === e.currentTarget) clearSelection();
      }}
    >
      <div
        className="relative shrink-0 shadow-2xl"
        style={{ width: displayWidth, height: displayHeight }}
        data-canvas-wrapper
        ref={canvasBoxRef}
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
                      onDividerChange={(cuts) => updateObject(page.id, obj.id, { dividerCuts: cuts })}
                    />
                  );
                }
                if (obj.type === 'image') {
                  return (
                    <ImageNode
                      key={obj.id}
                      obj={obj}
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
              name="editor-only"
              rotateAnchorOffset={24}
              borderStroke="#5b8def"
              anchorStroke="#5b8def"
              anchorFill="#ffffff"
              anchorSize={10}
              boundBoxFunc={(oldBox, newBox) => (newBox.width < 30 || newBox.height < 20 ? oldBox : newBox)}
            />
          </Layer>
        </Stage>
        {/* Drop target highlight while dragging a picture over a phone */}
        {dropTargetId &&
          (() => {
            const target = page.objects.find((o) => o.id === dropTargetId);
            if (!target) return null;
            const b = getObjectBBox(target);
            return (
              <div
                className="pointer-events-none absolute rounded-xl border-2 border-dashed border-blue-400 bg-blue-500/10"
                style={{ left: b.x * viewScale, top: b.y * viewScale, width: b.width * viewScale, height: b.height * viewScale }}
              />
            );
          })()}
        {/* Gap between panels: editor-only cover, dropped from the exported images */}
        {Array.from({ length: (page.spread ?? 1) - 1 }, (_, i) => {
          const panelW = panelWidthOf(page);
          const gap = spreadGap(panelW);
          return (
            <div
              key={i}
              className="pointer-events-none absolute inset-y-0 bg-neutral-900"
              style={{ left: (panelW + i * (panelW + gap)) * viewScale, width: gap * viewScale }}
            />
          );
        })}

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
