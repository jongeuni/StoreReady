import type Konva from 'konva';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { DEVICE_PRESETS } from '../devicePresets';
import { Button } from './ui/Field';
import { exportPageAsPng, exportPagesAsZip, exportStageToDataUrl } from '../utils/export';

export function TopBar({
  stageRef,
  onOpenOnboarding,
}: {
  stageRef: React.RefObject<Konva.Stage | null>;
  onOpenOnboarding: () => void;
}) {
  const project = useProjectStore((s) => s.project);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const selectPage = useProjectStore((s) => s.selectPage);
  const renameProject = useProjectStore((s) => s.renameProject);
  const setDevicePreset = useProjectStore((s) => s.setDevicePreset);
  const openPromptWizard = useProjectStore((s) => s.openPromptWizard);
  const pushToast = useToastStore((s) => s.push);

  const currentPage = project.pages.find((p) => p.id === currentPageId);

  const handleDownload = () => {
    const stage = stageRef.current;
    if (!stage || !currentPage) {
      pushToast('Nothing to export yet.', 'error');
      return;
    }
    try {
      exportPageAsPng(stage, currentPage.label);
    } catch (err) {
      console.error(err);
      pushToast('Export failed. Please try again.', 'error');
    }
  };

  const handleExportAll = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    try {
      const entries: { label: string; dataUrl: string }[] = [];
      const originalPageId = currentPageId;
      for (const page of project.pages) {
        selectPage(page.id);
        // Let React re-render this page's canvas before capturing it.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        entries.push({ label: page.label, dataUrl: exportStageToDataUrl(stage) });
      }
      selectPage(originalPageId);
      await exportPagesAsZip(entries, `${project.name || 'app-store-screenshots'}.zip`);
      pushToast('ZIP export complete.', 'success');
    } catch (err) {
      console.error(err);
      pushToast('ZIP export failed. Please try again.', 'error');
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenOnboarding}
          title="StoreReady 소개 다시 보기"
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
          title="App Store screenshot device size"
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
        >
          {DEVICE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label} ({p.width}×{p.height})
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={openPromptWizard}>Generate AI Prompt</Button>
        <Button onClick={handleExportAll}>Export All (ZIP)</Button>
        <Button variant="primary" onClick={handleDownload}>
          Download PNG
        </Button>
      </div>
    </header>
  );
}
