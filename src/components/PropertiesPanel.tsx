import { useRef, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { useTextEditStore } from '../store/useTextEditStore';
import type { DeviceKind, Page, PhoneObject, ShapeKind, TextRole } from '../types';
import { Button, ColorField, NumberField, SelectField, TextField } from './ui/Field';
import { readImageFile } from '../utils/imageUpload';
import { DEFAULT_DIVIDER_COLOR, dividerWidthOf } from '../utils/diagonalSplit';
import { defaultModelForKind, deviceHeightForWidth, getDeviceModel, modelsForKind } from '../phoneFrame';
import { DEVICE_KIND_KEY, useT, type TKey } from '../i18n';

const FONT_OPTIONS = [
  { value: 'system-ui, -apple-system, "SF Pro Display", sans-serif', label: 'System (SF Pro)' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Serif (Georgia)' },
  { value: '"Courier New", monospace', label: 'Monospace' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet MS' },
];

const WEIGHTS: { value: string; key: TKey }[] = [
  { value: '400', key: 'weight.400' },
  { value: '500', key: 'weight.500' },
  { value: '600', key: 'weight.600' },
  { value: '700', key: 'weight.700' },
  { value: '800', key: 'weight.800' },
];

const DEVICE_KINDS: DeviceKind[] = ['phone', 'tablet', 'watch'];

const ROLE_KEY: Record<TextRole, TKey> = {
  headline: 'role.headline',
  subheadline: 'role.subheadline',
  body: 'role.body',
};

const SHAPE_KEY: Record<ShapeKind, TKey> = { rect: 'shape.rect', ellipse: 'shape.ellipse' };

function LayerControls({ pageId, objectId }: { pageId: string; objectId: string }) {
  const t = useT();
  const bringForward = useProjectStore((s) => s.bringForward);
  const sendBackward = useProjectStore((s) => s.sendBackward);
  const bringToFront = useProjectStore((s) => s.bringToFront);
  const sendToBack = useProjectStore((s) => s.sendToBack);
  return (
    <div>
      <div className="mb-1 text-xs text-neutral-400">{t('panel.layer')}</div>
      <div className="grid grid-cols-2 gap-1.5">
        <Button onClick={() => bringToFront(pageId, objectId)}>{t('panel.bringToFront')}</Button>
        <Button onClick={() => sendToBack(pageId, objectId)}>{t('panel.sendToBack')}</Button>
        <Button onClick={() => bringForward(pageId, objectId)}>{t('panel.bringForward')}</Button>
        <Button onClick={() => sendBackward(pageId, objectId)}>{t('panel.sendBackward')}</Button>
      </div>
    </div>
  );
}

function ObjectActions({ pageId, objectId }: { pageId: string; objectId: string }) {
  const t = useT();
  const duplicateObject = useProjectStore((s) => s.duplicateObject);
  const removeObject = useProjectStore((s) => s.removeObject);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Button onClick={() => duplicateObject(pageId, objectId)}>{t('common.duplicate')}</Button>
      <Button variant="danger" onClick={() => removeObject(pageId, objectId)}>
        {t('common.delete')}
      </Button>
    </div>
  );
}

function PhonePanel({ page, objectId }: { page: Page; objectId: string }) {
  const t = useT();
  const obj = page.objects.find((o) => o.id === objectId);
  const project = useProjectStore((s) => s.project);
  const updateObject = useProjectStore((s) => s.updateObject);
  const setScreenshotImage = useProjectStore((s) => s.setScreenshotImage);
  const clearScreenshotImage = useProjectStore((s) => s.clearScreenshotImage);
  const pushToast = useToastStore((s) => s.push);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which screenshot row "Replace image" acts on; a fresh upload becomes the active one.
  const [activeIdx, setActiveIdx] = useState(0);
  const uploadMode = useRef<'replace' | 'add'>('replace');
  const [aiOpen, setAiOpen] = useState(false);

  if (!obj || obj.type !== 'phone') return null;

  const themes = obj.extraThemes ?? [];
  const setThemes = (next: typeof themes) => updateObject(page.id, obj.id, { extraThemes: next });
  // Row 0 is the phone's own screenshot; the rest are the extra diagonal-band themes.
  const rows = [
    { name: obj.screenshotName, fileName: obj.imageFileName, hasImage: !!obj.image },
    ...themes.map((th) => ({ name: th.name, fileName: th.imageFileName, hasImage: !!th.image })),
  ];
  const safeActive = Math.min(activeIdx, rows.length - 1);

  const applyUploadedImage = (mode: 'replace' | 'add', dataUrl: string, fileName: string) => {
    if (mode === 'add') {
      if (!obj.image) {
        setScreenshotImage(page.id, obj.id, dataUrl, fileName);
        setActiveIdx(0);
        return;
      }
      // Fill an empty placeholder theme first (e.g. from the diagonal-split template), otherwise add a new band.
      const empty = themes.findIndex((th) => !th.image);
      if (empty !== -1) {
        setThemes(themes.map((th, k) => (k === empty ? { ...th, image: dataUrl, imageFileName: fileName } : th)));
        setActiveIdx(empty + 1);
        return;
      }
      const name = `${obj.screenshotName || 'screen'}_${themes.length + 2}`;
      setThemes([...themes, { name, image: dataUrl, imageFileName: fileName }]);
      setActiveIdx(themes.length + 1);
      return;
    }
    if (safeActive === 0) setScreenshotImage(page.id, obj.id, dataUrl, fileName);
    else setThemes(themes.map((th, k) => (k === safeActive - 1 ? { ...th, image: dataUrl, imageFileName: fileName } : th)));
  };

  const removeRow = (i: number) => {
    if (i === 0) {
      if (themes.length === 0) {
        clearScreenshotImage(page.id, obj.id);
      } else {
        // The first extra theme takes over as the phone's own screenshot.
        const [first, ...rest] = themes;
        updateObject(page.id, obj.id, { image: first.image, imageFileName: first.imageFileName, extraThemes: rest });
      }
    } else {
      setThemes(themes.filter((_, k) => k !== i - 1));
    }
    setActiveIdx(0);
  };

  const page1 = project.pages[0];
  const page1Reference =
    page1 && page1.id !== page.id
      ? (page1.objects.find((o): o is PhoneObject => o.type === 'phone' && o.id !== obj.id) ?? null)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label={t('panel.deviceKind')}
        value={obj.deviceKind ?? 'phone'}
        options={DEVICE_KINDS.map((k) => ({ value: k, label: t(DEVICE_KIND_KEY[k]) }))}
        onChange={(v) => updateObject(page.id, obj.id, { deviceKind: v, deviceModel: defaultModelForKind(v).id })}
      />

      <SelectField
        label={t('panel.model')}
        value={getDeviceModel(obj.deviceModel, obj.deviceKind ?? 'phone').id}
        options={modelsForKind(obj.deviceKind ?? 'phone').map((m) => ({ value: m.id, label: m.label }))}
        onChange={(v) => updateObject(page.id, obj.id, { deviceModel: v })}
      />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setAiOpen((v) => !v)}
          aria-expanded={aiOpen}
          className="flex items-center gap-1.5 text-left text-xs text-neutral-300 hover:text-neutral-100"
        >
          <span className={`text-[10px] transition-transform ${aiOpen ? 'rotate-180' : ''}`}>▾</span>
          {t('panel.aiCapture')}
        </button>
        {aiOpen && (
          <>
            <div>
              <TextField
                label={t('panel.screenshotName')}
                value={obj.screenshotName}
                onChange={(v) => updateObject(page.id, obj.id, { screenshotName: v })}
              />
              <p className="mt-1 text-[11px] leading-snug text-neutral-500">{t('panel.nameHint')}</p>
            </div>

            <label className="flex flex-col gap-1 text-xs text-neutral-400">
              <span>{t('panel.description')}</span>
              <textarea
                value={obj.screenshotDescription ?? ''}
                onChange={(e) => updateObject(page.id, obj.id, { screenshotDescription: e.target.value })}
                rows={2}
                placeholder={t('panel.descriptionPlaceholder')}
                className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-xs text-neutral-400">{t('panel.screenshotImage')}</div>
        <span className="text-[11px] leading-snug text-neutral-500">{t('panel.splitHint')}</span>
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
              pushToast(t(result.errorKey, result.errorVars), 'error');
              return;
            }
            applyUploadedImage(uploadMode.current, result.dataUrl, file.name);
          }}
        />
        <div className="flex gap-1.5">
          {obj.image && (
            <Button
              variant="primary"
              onClick={() => {
                uploadMode.current = 'replace';
                fileInputRef.current?.click();
              }}
            >
              {t('panel.replace')}
            </Button>
          )}
          <Button
            variant={obj.image ? 'default' : 'primary'}
            onClick={() => {
              uploadMode.current = 'add';
              fileInputRef.current?.click();
            }}
          >
            {t('panel.upload')}
          </Button>
        </div>
        {rows.some((r) => r.hasImage) ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {rows.map((r, i) =>
              r.hasImage ? (
                <div key={i} className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`max-w-[9rem] min-w-0 truncate text-left ${
                      rows.length > 1 && i === safeActive ? 'text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {r.fileName ?? t('panel.uploadedFallback')}
                  </button>
                  <button
                    type="button"
                    aria-label={t('panel.remove')}
                    title={t('panel.remove')}
                    onClick={() => removeRow(i)}
                    className="shrink-0 rounded px-1 leading-none text-neutral-500 hover:bg-neutral-800 hover:text-neutral-100"
                  >
                    ×
                  </button>
                </div>
              ) : null,
            )}
          </div>
        ) : (
          <span className="text-[11px] text-neutral-500">{t('panel.noImage')}</span>
        )}
      </div>

      {rows.length > 1 && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-neutral-400">{t('panel.divider')}</div>
          <div className="grid grid-cols-2 gap-2">
            <NumberField
              label={t('panel.dividerThickness')}
              value={dividerWidthOf(obj)}
              min={0}
              onChange={(v) => updateObject(page.id, obj.id, { dividerWidth: Math.max(0, v) })}
            />
            <SelectField
              label={t('panel.dividerStyle')}
              value={obj.dividerDashed ? 'dashed' : 'solid'}
              options={[
                { value: 'solid', label: t('panel.dividerSolid') },
                { value: 'dashed', label: t('panel.dividerDashed') },
              ]}
              onChange={(v) => updateObject(page.id, obj.id, { dividerDashed: v === 'dashed' })}
            />
          </div>
          <ColorField
            label={t('panel.dividerColor')}
            value={obj.dividerColor ?? DEFAULT_DIVIDER_COLOR}
            onChange={(v) => updateObject(page.id, obj.id, { dividerColor: v })}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {page1Reference && (
          <div className="col-span-2">
            <Button onClick={() => updateObject(page.id, obj.id, { width: page1Reference.width })}>
              {t('panel.matchPage1', { width: page1Reference.width })}
            </Button>
          </div>
        )}
        <NumberField
          label={t('panel.width')}
          value={obj.width}
          min={40}
          onChange={(v) => updateObject(page.id, obj.id, { width: Math.max(40, v) })}
        />
        <NumberField
          label={t('panel.heightAuto')}
          value={deviceHeightForWidth(obj.width, obj.deviceKind, obj.deviceModel)}
          onChange={() => {}}
        />
        <NumberField label={t('panel.posX')} value={obj.left} onChange={(v) => updateObject(page.id, obj.id, { left: v })} />
        <NumberField label={t('panel.posY')} value={obj.top} onChange={(v) => updateObject(page.id, obj.id, { top: v })} />
        <NumberField
          label={t('panel.rotation')}
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
  const t = useT();
  const obj = page.objects.find((o) => o.id === objectId);
  const updateObject = useProjectStore((s) => s.updateObject);
  const applyColorToSelection = useTextEditStore((s) => s.applyColorToSelection);
  if (!obj || obj.type !== 'text') return null;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs text-neutral-400">
        <span>{t('panel.textLabel', { role: t(ROLE_KEY[obj.role]) })}</span>
        <textarea
          value={obj.text}
          onChange={(e) => updateObject(page.id, obj.id, { text: e.target.value, runs: undefined })}
          rows={3}
          className="w-full resize-none rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 focus:border-blue-500 focus:outline-none"
        />
        <span className="text-[11px] text-neutral-500">{t('panel.textHint')}</span>
      </label>

      <SelectField
        label={t('panel.font')}
        value={obj.fontFamily}
        options={FONT_OPTIONS}
        onChange={(v) => updateObject(page.id, obj.id, { fontFamily: v })}
      />

      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label={t('panel.fontSize')}
          value={obj.fontSize}
          min={8}
          onChange={(v) => updateObject(page.id, obj.id, { fontSize: v })}
        />
        <SelectField
          label={t('panel.weight')}
          value={String(obj.fontWeight)}
          options={WEIGHTS.map((w) => ({ value: w.value, label: t(w.key) }))}
          onChange={(v) => updateObject(page.id, obj.id, { fontWeight: Number(v) })}
        />
      </div>

      <div data-text-color-target>
        <ColorField
          label={t('panel.color')}
          value={obj.color}
          onChange={(v) => {
            if (applyColorToSelection) applyColorToSelection(v);
            else updateObject(page.id, obj.id, { color: v });
          }}
        />
      </div>

      <div>
        <div className="mb-1 text-xs text-neutral-400">{t('panel.alignment')}</div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['left', 'center', 'right'] as const).map((a) => (
            <Button key={a} variant={obj.align === a ? 'primary' : 'default'} onClick={() => updateObject(page.id, obj.id, { align: a })}>
              {t(`align.${a}`)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label={t('panel.width')} value={obj.width} min={40} onChange={(v) => updateObject(page.id, obj.id, { width: v })} />
        <NumberField label={t('panel.rotation')} value={obj.rotation} onChange={(v) => updateObject(page.id, obj.id, { rotation: v })} />
        <NumberField label={t('panel.posX')} value={obj.x} onChange={(v) => updateObject(page.id, obj.id, { x: v })} />
        <NumberField label={t('panel.posY')} value={obj.y} onChange={(v) => updateObject(page.id, obj.id, { y: v })} />
      </div>

      <LayerControls pageId={page.id} objectId={obj.id} />
      <ObjectActions pageId={page.id} objectId={obj.id} />
    </div>
  );
}

function ShapePanel({ page, objectId }: { page: Page; objectId: string }) {
  const t = useT();
  const obj = page.objects.find((o) => o.id === objectId);
  const updateObject = useProjectStore((s) => s.updateObject);
  if (!obj || obj.type !== 'shape') return null;

  return (
    <div className="flex flex-col gap-4">
      <ColorField label={t('panel.fillColor')} value={obj.fill} onChange={(v) => updateObject(page.id, obj.id, { fill: v })} />

      {obj.shapeKind === 'rect' && (
        <NumberField
          label={t('panel.cornerRadius')}
          value={obj.cornerRadius ?? 0}
          min={0}
          onChange={(v) => updateObject(page.id, obj.id, { cornerRadius: v })}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumberField label={t('panel.width')} value={obj.width} min={10} onChange={(v) => updateObject(page.id, obj.id, { width: v })} />
        <NumberField label={t('panel.height')} value={obj.height} min={10} onChange={(v) => updateObject(page.id, obj.id, { height: v })} />
        <NumberField label={t('panel.posX')} value={obj.left} onChange={(v) => updateObject(page.id, obj.id, { left: v })} />
        <NumberField label={t('panel.posY')} value={obj.top} onChange={(v) => updateObject(page.id, obj.id, { top: v })} />
        <NumberField label={t('panel.rotation')} value={obj.rotation} onChange={(v) => updateObject(page.id, obj.id, { rotation: v })} />
      </div>

      <LayerControls pageId={page.id} objectId={obj.id} />
      <ObjectActions pageId={page.id} objectId={obj.id} />
    </div>
  );
}

function BackgroundPanel({ page }: { page: Page }) {
  const t = useT();
  const setBackground = useProjectStore((s) => s.setBackground);
  const bg = page.canvas.background;

  return (
    <div className="flex flex-col gap-4">
      <SelectField
        label={t('bg.type')}
        value={bg.type}
        options={[
          { value: 'solid', label: t('bg.solid') },
          { value: 'gradient', label: t('bg.gradient') },
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
        <ColorField label={t('bg.color')} value={bg.color} onChange={(v) => setBackground(page.id, { type: 'solid', color: v })} />
      )}

      {bg.type === 'gradient' && (
        <>
          <ColorField
            label={t('bg.color1')}
            value={bg.colors[0]}
            onChange={(v) => setBackground(page.id, { ...bg, colors: [v, bg.colors[1]] })}
          />
          <ColorField
            label={t('bg.color2')}
            value={bg.colors[1]}
            onChange={(v) => setBackground(page.id, { ...bg, colors: [bg.colors[0], v] })}
          />
          <NumberField
            label={t('bg.angle')}
            value={bg.angle}
            min={0}
            max={360}
            onChange={(v) => setBackground(page.id, { ...bg, angle: v })}
          />
        </>
      )}

      <p className="text-[11px] leading-snug text-neutral-500">{t('bg.note')}</p>
    </div>
  );
}

function AddTextMenu({ pageId }: { pageId: string }) {
  const t = useT();
  const addTextObject = useProjectStore((s) => s.addTextObject);
  const roles: { role: TextRole; key: TKey }[] = [
    { role: 'headline', key: 'panel.addHeadline' },
    { role: 'subheadline', key: 'panel.addSubheadline' },
    { role: 'body', key: 'panel.addBody' },
  ];
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {roles.map((r) => (
        <Button key={r.role} onClick={() => addTextObject(pageId, r.role)}>
          {t(r.key)}
        </Button>
      ))}
    </div>
  );
}

function AddShapeMenu({ pageId }: { pageId: string }) {
  const t = useT();
  const addShapeObject = useProjectStore((s) => s.addShapeObject);
  const kinds: { kind: ShapeKind; key: TKey }[] = [
    { kind: 'rect', key: 'panel.addRect' },
    { kind: 'ellipse', key: 'panel.addCircle' },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {kinds.map((k) => (
        <Button key={k.kind} onClick={() => addShapeObject(pageId, k.kind)}>
          {t(k.key)}
        </Button>
      ))}
    </div>
  );
}

export function PropertiesPanel({ page }: { page: Page }) {
  const t = useT();
  const selectedObjectIds = useProjectStore((s) => s.selectedObjectIds);

  const singleSelected = selectedObjectIds.length === 1 ? page.objects.find((o) => o.id === selectedObjectIds[0]) : undefined;

  return (
    <aside className="flex w-[300px] shrink-0 flex-col gap-5 overflow-y-auto border-l border-neutral-800 bg-neutral-900 p-4">
      {selectedObjectIds.length > 1 ? (
        <div className="rounded border border-neutral-700 bg-neutral-800/60 p-3 text-xs text-neutral-400">
          {t('panel.multiSelected', { count: selectedObjectIds.length })}
        </div>
      ) : singleSelected ? (
        <>
          <h2 className="text-sm font-semibold text-neutral-200">
            {singleSelected.type === 'phone'
              ? t(DEVICE_KIND_KEY[singleSelected.deviceKind ?? 'phone'])
              : singleSelected.type === 'shape'
                ? t('panel.shapeTitle', { kind: t(SHAPE_KEY[singleSelected.shapeKind]) })
                : t('panel.textTitle', { role: t(ROLE_KEY[singleSelected.role]) })}
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
            <h2 className="mb-2 text-sm font-semibold text-neutral-200">{t('panel.addToPage')}</h2>
            <p className="mb-2 text-[11px] text-neutral-500">{t('panel.addDeviceHint')}</p>
            <div className="flex flex-col gap-3">
              <AddTextMenu pageId={page.id} />
              <AddShapeMenu pageId={page.id} />
            </div>
          </div>
          <div className="border-t border-neutral-800 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-200">{t('bg.title')}</h2>
            <BackgroundPanel page={page} />
          </div>
        </>
      )}
    </aside>
  );
}
