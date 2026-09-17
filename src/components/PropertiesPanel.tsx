import { useRef } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { useTextEditStore } from '../store/useTextEditStore';
import type { DeviceKind, Page, PhoneObject, ShapeKind, TextRole } from '../types';
import { Button, ColorField, NumberField, SelectField, TextField } from './ui/Field';
import { readImageFile } from '../utils/imageUpload';
import { DEVICE_KIND_LABELS, defaultModelForKind, deviceHeightForWidth, getDeviceModel, modelsForKind } from '../phoneFrame';

const FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, "SF Pro Display", sans-serif', label: 'System (SF Pro)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif (Georgia)' },
  { value: '"Courier New", monospace', label: 'Monospace' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
];

const WEIGHT_OPTIONS = [
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Heavy' },
];

const DEVICE_KIND_OPTIONS = (Object.keys(DEVICE_KIND_LABELS) as DeviceKind[]).map((value) => ({
  value,
  label: DEVICE_KIND_LABELS[value],
}));

function LayerControls({ pageId, objectId }: { pageId: string; objectId: string }) {
  const bringForward = useProjectStore((s) => s.bringForward);
  const sendBackward = useProjectStore((s) => s.sendBackward);
  const bringToFront = useProjectStore((s) => s.bringToFront);
  const sendToBack = useProjectStore((s) => s.sendToBack);
  return (
    <div>
      <div className="mb-1 text-xs text-neutral-400">Layer</div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button onClick={() => bringToFront(pageId, objectId)} title="Bring to front">
          Bring to front
        </Button>
        <Button onClick={() => sendToBack(pageId, objectId)} title="Send to back">
          Send to back
        </Button>
        <Button onClick={() => bringForward(pageId, objectId)} title="Bring forward">
          Bring forward
        </Button>
        <Button onClick={() => sendBackward(pageId, objectId)} title="Send backward">
          Send backward
        </Button>
      </div>
    </div>
  );
}

function ObjectActions({ pageId, objectId }: { pageId: string; objectId: string }) {
  const duplicateObject = useProjectStore((s) => s.duplicateObject);
  const removeObject = useProjectStore((s) => s.removeObject);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Button onClick={() => duplicateObject(pageId, objectId)}>Duplicate</Button>
      <Button variant="danger" onClick={() => removeObject(pageId, objectId)}>
        Delete
      </Button>
    </div>
  );
}

function PhonePanel({ page, objectId }: { page: Page; objectId: string }) {
  const obj = page.objects.find((o) => o.id === objectId);
  const project = useProjectStore((s) => s.project);
  const updateObject = useProjectStore((s) => s.updateObject);
  const setScreenshotImage = useProjectStore((s) => s.setScreenshotImage);
  const clearScreenshotImage = useProjectStore((s) => s.clearScreenshotImage);
  const pushToast = useToastStore((s) => s.push);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!obj || obj.type !== 'phone') return null;

  const page1 = project.pages[0];
  const page1Reference =
    page1 && page1.id !== page.id
      ? (page1.objects.find((o): o is PhoneObject => o.type === 'phone' && o.id !== obj.id) ?? null)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Device kind"
        value={obj.deviceKind ?? 'phone'}
        options={DEVICE_KIND_OPTIONS}
        onChange={(v) => updateObject(page.id, obj.id, { deviceKind: v, deviceModel: defaultModelForKind(v).id })}
      />

      <SelectField
        label="Model"
        value={getDeviceModel(obj.deviceModel, obj.deviceKind ?? 'phone').id}
        options={modelsForKind(obj.deviceKind ?? 'phone').map((m) => ({ value: m.id, label: m.label }))}
        onChange={(v) => updateObject(page.id, obj.id, { deviceModel: v })}
      />

      <div>
        <TextField
          label="Screenshot name"
          value={obj.screenshotName}
          onChange={(v) => updateObject(page.id, obj.id, { screenshotName: v })}
        />
        <p className="mt-1 text-[11px] leading-snug text-neutral-500">
          This name tells your AI coding agent which app screen to capture for this phone — it will appear as{' '}
          <code className="text-neutral-400">"img": "{obj.screenshotName || 'name'}"</code> in the generated prompt.
        </p>
      </div>

      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        <span>Screenshot description (optional)</span>
        <textarea
          value={obj.screenshotDescription ?? ''}
          onChange={(e) => updateObject(page.id, obj.id, { screenshotDescription: e.target.value })}
          rows={2}
          placeholder="e.g. Home screen with 3 completed tasks and the streak banner visible"
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
        />
      </label>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-neutral-400">Screenshot image</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            const result = await readImageFile(file);
            if (!result.ok) {
              pushToast(result.error, 'error');
              return;
            }
            setScreenshotImage(page.id, obj.id, result.dataUrl, file.name);
          }}
        />
        <div className="flex gap-1.5">
          <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
            {obj.image ? 'Replace image' : 'Upload image'}
          </Button>
          {obj.image && (
            <Button variant="ghost" onClick={() => clearScreenshotImage(page.id, obj.id)}>
              Remove
            </Button>
          )}
        </div>
        {obj.image ? (
          <span className="truncate text-[11px] text-neutral-500">{obj.imageFileName ?? 'uploaded'}</span>
        ) : (
          <span className="text-[11px] text-neutral-500">No screenshot yet — shown as a placeholder on canvas.</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {page1Reference && (
          <div className="col-span-2">
            <Button onClick={() => updateObject(page.id, obj.id, { width: page1Reference.width })}>
              Page 1과 크기 맞추기 ({page1Reference.width}px)
            </Button>
          </div>
        )}
        <NumberField
          label="Width"
          value={obj.width}
          min={40}
          onChange={(v) => updateObject(page.id, obj.id, { width: Math.max(40, v) })}
        />
        <NumberField
          label="Height (auto)"
          value={deviceHeightForWidth(obj.width, obj.deviceKind, obj.deviceModel)}
          onChange={() => {}}
        />
        <NumberField label="Position X" value={obj.left} onChange={(v) => updateObject(page.id, obj.id, { left: v })} />
        <NumberField label="Position Y" value={obj.top} onChange={(v) => updateObject(page.id, obj.id, { top: v })} />
        <NumberField
          label="Rotation"
          value={obj.rotation}
          onChange={(v) => updateObject(page.id, obj.id, { rotation: v })}
        />
      </div>

      <LayerControls pageId={page.id} objectId={obj.id} />
      <ObjectActions pageId={page.id} objectId={obj.id} />
    </div>
  );
}

function TextPanel({ page, objectId }: { page: Page; objectId: string }) {
  const obj = page.objects.find((o) => o.id === objectId);
  const updateObject = useProjectStore((s) => s.updateObject);
  const applyColorToSelection = useTextEditStore((s) => s.applyColorToSelection);
  if (!obj || obj.type !== 'text') return null;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        <span>Text ({obj.role})</span>
        <textarea
          value={obj.text}
          onChange={(e) => updateObject(page.id, obj.id, { text: e.target.value, runs: undefined })}
          rows={3}
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-[11px] text-neutral-500">
          캔버스에서 더블클릭하면 직접 편집할 수 있어요. 편집 중 일부 글자만 드래그로 선택한 다음, 아래 Color를 바꾸면
          선택한 글자에만 색이 적용돼요.
        </span>
      </label>

      <SelectField
        label="Font"
        value={obj.fontFamily}
        options={FONT_OPTIONS}
        onChange={(v) => updateObject(page.id, obj.id, { fontFamily: v })}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Font size" value={obj.fontSize} min={8} onChange={(v) => updateObject(page.id, obj.id, { fontSize: v })} />
        <SelectField
          label="Weight"
          value={String(obj.fontWeight)}
          options={WEIGHT_OPTIONS}
          onChange={(v) => updateObject(page.id, obj.id, { fontWeight: Number(v) })}
        />
      </div>

      <div data-text-color-target>
        <ColorField
          label="Color"
          value={obj.color}
          onChange={(v) => {
            if (applyColorToSelection) applyColorToSelection(v);
            else updateObject(page.id, obj.id, { color: v });
          }}
        />
      </div>

      <div>
        <div className="mb-1 text-xs text-neutral-400">Alignment</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['left', 'center', 'right'] as const).map((a) => (
            <Button key={a} variant={obj.align === a ? 'primary' : 'default'} onClick={() => updateObject(page.id, obj.id, { align: a })}>
              {a}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width" value={obj.width} min={40} onChange={(v) => updateObject(page.id, obj.id, { width: v })} />
        <NumberField label="Rotation" value={obj.rotation} onChange={(v) => updateObject(page.id, obj.id, { rotation: v })} />
        <NumberField label="Position X" value={obj.x} onChange={(v) => updateObject(page.id, obj.id, { x: v })} />
        <NumberField label="Position Y" value={obj.y} onChange={(v) => updateObject(page.id, obj.id, { y: v })} />
      </div>

      <LayerControls pageId={page.id} objectId={obj.id} />
      <ObjectActions pageId={page.id} objectId={obj.id} />
    </div>
  );
}

function ShapePanel({ page, objectId }: { page: Page; objectId: string }) {
  const obj = page.objects.find((o) => o.id === objectId);
  const updateObject = useProjectStore((s) => s.updateObject);
  if (!obj || obj.type !== 'shape') return null;

  return (
    <div className="flex flex-col gap-4">
      <ColorField label="Fill color" value={obj.fill} onChange={(v) => updateObject(page.id, obj.id, { fill: v })} />

      {obj.shapeKind === 'rect' && (
        <NumberField
          label="Corner radius"
          value={obj.cornerRadius ?? 0}
          min={0}
          onChange={(v) => updateObject(page.id, obj.id, { cornerRadius: v })}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Width" value={obj.width} min={10} onChange={(v) => updateObject(page.id, obj.id, { width: v })} />
        <NumberField label="Height" value={obj.height} min={10} onChange={(v) => updateObject(page.id, obj.id, { height: v })} />
        <NumberField label="Position X" value={obj.left} onChange={(v) => updateObject(page.id, obj.id, { left: v })} />
        <NumberField label="Position Y" value={obj.top} onChange={(v) => updateObject(page.id, obj.id, { top: v })} />
        <NumberField label="Rotation" value={obj.rotation} onChange={(v) => updateObject(page.id, obj.id, { rotation: v })} />
      </div>

      <LayerControls pageId={page.id} objectId={obj.id} />
      <ObjectActions pageId={page.id} objectId={obj.id} />
    </div>
  );
}

function BackgroundPanel({ page }: { page: Page }) {
  const setBackground = useProjectStore((s) => s.setBackground);
  const bg = page.canvas.background;

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label="Background type"
        value={bg.type}
        options={[
          { value: 'solid', label: 'Solid color' },
          { value: 'gradient', label: 'Gradient' },
        ]}
        onChange={(v) => {
          if (v === 'solid') setBackground(page.id, { type: 'solid', color: bg.type === 'solid' ? bg.color : '#000000' });
          else if (v === 'gradient')
            setBackground(page.id, {
              type: 'gradient',
              colors: bg.type === 'gradient' ? bg.colors : ['#0f0f12', '#2b2b33'],
              angle: bg.type === 'gradient' ? bg.angle : 165,
            });
        }}
      />

      {bg.type === 'solid' && (
        <ColorField label="Color" value={bg.color} onChange={(v) => setBackground(page.id, { type: 'solid', color: v })} />
      )}

      {bg.type === 'gradient' && (
        <>
          <ColorField
            label="Color 1"
            value={bg.colors[0]}
            onChange={(v) => setBackground(page.id, { ...bg, colors: [v, bg.colors[1]] })}
          />
          <ColorField
            label="Color 2"
            value={bg.colors[1]}
            onChange={(v) => setBackground(page.id, { ...bg, colors: [bg.colors[0], v] })}
          />
          <NumberField
            label="Angle"
            value={bg.angle}
            min={0}
            max={360}
            onChange={(v) => setBackground(page.id, { ...bg, angle: v })}
          />
        </>
      )}

      <p className="text-[11px] leading-snug text-neutral-500">
        Image backgrounds are planned as a future premium feature. Transparent backgrounds aren't supported — App Store
        screenshots can't have transparency.
      </p>
    </div>
  );
}

function AddTextMenu({ pageId }: { pageId: string }) {
  const addTextObject = useProjectStore((s) => s.addTextObject);
  const roles: { role: TextRole; label: string }[] = [
    { role: 'headline', label: '+ Headline' },
    { role: 'subheadline', label: '+ Subheadline' },
    { role: 'body', label: '+ Body text' },
  ];
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {roles.map((r) => (
        <Button key={r.role} onClick={() => addTextObject(pageId, r.role)}>
          {r.label}
        </Button>
      ))}
    </div>
  );
}

function AddShapeMenu({ pageId }: { pageId: string }) {
  const addShapeObject = useProjectStore((s) => s.addShapeObject);
  const kinds: { kind: ShapeKind; label: string }[] = [
    { kind: 'rect', label: '+ Rectangle' },
    { kind: 'ellipse', label: '+ Circle' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {kinds.map((k) => (
        <Button key={k.kind} onClick={() => addShapeObject(pageId, k.kind)}>
          {k.label}
        </Button>
      ))}
    </div>
  );
}

export function PropertiesPanel({ page }: { page: Page }) {
  const selectedObjectIds = useProjectStore((s) => s.selectedObjectIds);

  const singleSelected = selectedObjectIds.length === 1 ? page.objects.find((o) => o.id === selectedObjectIds[0]) : undefined;

  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4">
      {selectedObjectIds.length > 1 ? (
        <div className="rounded border border-neutral-700 bg-neutral-800/60 p-3 text-xs text-neutral-400">
          {selectedObjectIds.length} objects selected. Use the align toolbar above the canvas to line them up, or click
          empty space to deselect.
        </div>
      ) : singleSelected ? (
        <>
          <h2 className="text-sm font-semibold text-neutral-200">
            {singleSelected.type === 'phone'
              ? DEVICE_KIND_LABELS[singleSelected.deviceKind ?? 'phone']
              : singleSelected.type === 'shape'
                ? `Shape — ${singleSelected.shapeKind}`
                : `Text — ${singleSelected.role}`}
          </h2>
          {singleSelected.type === 'phone' ? (
            <PhonePanel page={page} objectId={singleSelected.id} />
          ) : singleSelected.type === 'shape' ? (
            <ShapePanel page={page} objectId={singleSelected.id} />
          ) : (
            <TextPanel page={page} objectId={singleSelected.id} />
          )}
        </>
      ) : (
        <>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-neutral-200">Add to page</h2>
            <p className="mb-2 text-[11px] text-neutral-500">
              기기(phone/tablet/watch)는 상단 툴바의 "+ 기기 추가" 드롭다운에서 추가하세요.
            </p>
            <div className="flex flex-col gap-3">
              <AddTextMenu pageId={page.id} />
              <AddShapeMenu pageId={page.id} />
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-200">Background</h2>
            <BackgroundPanel page={page} />
          </div>
        </>
      )}
    </aside>
  );
}
