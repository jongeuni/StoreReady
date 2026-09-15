import type Konva from 'konva';
import { useProjectStore } from '../store/useProjectStore';
import { useToastStore } from '../store/useToastStore';
import { DEVICE_PRESETS } from '../devicePresets';
import { Button } from './ui/Field';
import type { TargetFramework } from '../types';
import { exportPageAsPng, exportPagesAsZip, exportStageToDataUrl } from '../utils/export';

const FRAMEWORKS: { value: TargetFramework; label: string }[] = [
  { value: 'expo', label: 'Expo / React Native' },
  { value: 'react-native-cli', label: 'React Native CLI' },
  { value: 'flutter', label: 'Flutter' },
  { value: 'ios-native', label: 'iOS native' },
  { value: 'android-native', label: 'Android native' },
  { value: 'other', label: 'Other / not sure' },
];

export function TopBar({ stageRef }: { stageRef: React.RefObject<Konva.Stage | null> }) {
  const project = useProjectStore((s) => s.project);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const selectPage = useProjectStore((s) => s.selectPage);
  const renameProject = useProjectStore((s) => s.renameProject);
  const setDevicePreset = useProjectStore((s) => s.setDevicePreset);
  const setTargetFramework = useProjectStore((s) => s.setTargetFramework);
  const openPromptModal = useProjectStore((s) => s.openPromptModal);
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
        <span className="shrink-0 text-sm font-bold tracking-tight text-neutral-100">
          Store<span className="text-blue-400">Ready</span>
        </span>
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
        <select
          value={project.targetFramework}
          onChange={(e) => setTargetFramework(e.target.value as TargetFramework)}
          title="Target app framework, used to tailor the AI capture prompt"
          className="rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-200"
        >
          {FRAMEWORKS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => openPromptModal('all')}>Generate All Prompts</Button>
        <Button onClick={handleExportAll}>Export All (ZIP)</Button>
        <Button variant="primary" onClick={handleDownload}>
          Download PNG
        </Button>
      </div>
    </header>
  );
}
