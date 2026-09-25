import { useState } from 'react';
import type Konva from 'konva';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { useRouter } from '../router';
import { useT } from '../i18n';
import { LanguageSwitcher } from '../i18n/LanguageSwitcher';
import { DEVICE_PRESETS, DEVICE_PRESET_GROUPS } from '../devicePresets';
import { Button } from './ui/Field';
import { panelWidthOf, spreadGap } from '../utils/spread';
import { exportPageAsPng, exportPagesAsZip, exportStageToDataUrl, preloadProjectImages, sliceDataUrl } from '../utils/export';
import { waitForRender } from '../utils/renderGate';
import { PreviewModal } from './PreviewModal';

export function TopBar({ stageRef }: { stageRef: React.RefObject<Konva.Stage | null> }) {
  const { navigate } = useRouter();
  const t = useT();
  const project = useProjectStore((s) => s.project);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const selectPage = useProjectStore((s) => s.selectPage);
  const renameProject = useProjectStore((s) => s.renameProject);
  const setDevicePreset = useProjectStore((s) => s.setDevicePreset);
  const openPromptWizard = useProjectStore((s) => s.openPromptWizard);
  const pushToast = useToastStore((s) => s.push);

  const currentPage = project.pages.find((p) => p.id === currentPageId);
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);

  const handleDownload = async () => {
    const stage = stageRef.current;
    if (!stage || !currentPage) {
      pushToast(t('top.nothingToExport'), 'error');
      return;
    }
    try {
      const spread = currentPage.spread ?? 1;
      await exportPageAsPng(stage, currentPage.label, spread, {
        width: panelWidthOf(currentPage),
        height: currentPage.canvas.height,
        gap: spreadGap(panelWidthOf(currentPage)),
      });
    } catch (err) {
      console.error(err);
      pushToast(t('top.exportFailed'), 'error');
    }
  };

  /** Renders every page (two-screen pages as separate images) exactly as it will be exported. */
  const captureAllPages = async (): Promise<{ label: string; dataUrl: string }[] | null> => {
    const stage = stageRef.current;
    if (!stage) {
      pushToast(t('top.nothingToExport'), 'error');
      return null;
    }
    const originalPageId = currentPageId;
    try {
      // Warm the browser's image cache first, so each page's pictures are ready the moment it is shown.
      await preloadProjectImages(project.pages);

      const entries: { label: string; dataUrl: string }[] = [];
      for (const page of project.pages) {
        selectPage(page.id);
        // Wait for this page to render and for its pictures (incl. the 3D phone) to finish loading.
        await waitForRender();
        const spread = page.spread ?? 1;
        const whole = exportStageToDataUrl(stage);
        if (spread <= 1) {
          entries.push({ label: page.label, dataUrl: whole });
        } else {
          const slices = await sliceDataUrl(whole, spread, panelWidthOf(page), page.canvas.height, spreadGap(panelWidthOf(page)));
          slices.forEach((dataUrl, i) => entries.push({ label: `${page.label}_${i + 1}`, dataUrl }));
        }
      }
      return entries;
    } finally {
      // Always return to the page the user was on, even if a step threw.
      selectPage(originalPageId);
    }
  };

  const handleExportAll = async () => {
    try {
      const entries = await captureAllPages();
      if (!entries) return;
      await exportPagesAsZip(entries, `${project.name || 'app-store-screenshots'}.zip`);
      pushToast(t('top.zipDone'), 'success');
    } catch (err) {
      console.error(err);
      // Include the underlying reason so a failure on someone's machine can actually be diagnosed.
      const reason = err instanceof Error && err.message ? ` (${err.message})` : '';
      pushToast(`${t('top.zipFailed')}${reason}`, 'error');
    }
  };

  const handlePreview = async () => {
    if (previewBusy) return;
    setPreviewBusy(true);
    try {
      const entries = await captureAllPages();
      if (entries) setPreviewImages(entries.map((e) => e.dataUrl));
    } catch (err) {
      console.error(err);
      pushToast(t('top.exportFailed'), 'error');
    } finally {
      setPreviewBusy(false);
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          title={t('top.homeTitle')}
          className="shrink-0 rounded text-sm font-bold tracking-tight text-neutral-100 hover:text-neutral-300"
        >
          Store<span className="text-blue-400">Ready</span>
        </button>
        <span className="h-4 w-px bg-neutral-700" />
        <input
          value={project.name}
          onChange={(e) => renameProject(e.target.value)}
          className="w-44 rounded border border-transparent bg-transparent px-1.5 py-1 text-sm font-semibold text-neutral-100 hover:border-neutral-700 focus:border-blue-500 focus:bg-neutral-800 focus:outline-none"
        />
        <select
          value={project.devicePresetId}
          onChange={(e) => setDevicePreset(e.target.value)}
          title={t('top.deviceTitle')}
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
        >
          {DEVICE_PRESET_GROUPS.map((g) => (
            <optgroup key={g.kind} label={g.label}>
              {DEVICE_PRESETS.filter((p) => p.kind === g.kind).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.width}×{p.height})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button onClick={handlePreview}>{previewBusy ? t('top.previewBuilding') : t('top.preview')}</Button>
        <Button onClick={openPromptWizard}>{t('top.generatePrompt')}</Button>
        <Button onClick={handleExportAll}>{t('top.exportAll')}</Button>
        <Button variant="primary" onClick={handleDownload}>
          {t('top.downloadPng')}
        </Button>
      </div>
      {previewImages && <PreviewModal name={project.name} images={previewImages} onClose={() => setPreviewImages(null)} />}
    </header>
  );
}
