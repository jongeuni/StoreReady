import { useRef } from 'react';
import type Konva from 'konva';
import { useProjectStore } from './store/useProjectStore';
import { TopBar } from './components/TopBar';
import { PageTabs } from './components/PageTabs';
import { PageToolbar } from './components/PageToolbar';
import { CanvasStage } from './components/CanvasStage';
import { PageInfoBar } from './components/PageInfoBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PromptWizardModal } from './components/PromptWizardModal';
import { Toasts } from './components/Toasts';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const project = useProjectStore((s) => s.project);
  const currentPageId = useProjectStore((s) => s.currentPageId);
  const page = project.pages.find((p) => p.id === currentPageId) ?? project.pages[0];

  useKeyboardShortcuts(page.id);

  return (
    <div className="flex h-screen w-screen flex-col bg-neutral-950 text-neutral-100">
      <TopBar stageRef={stageRef} />
      <PageTabs />
      <PageToolbar page={page} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <CanvasStage page={page} stageRef={stageRef} />
          <PageInfoBar page={page} />
        </div>
        <PropertiesPanel page={page} />
      </div>
      <PromptWizardModal />
      <Toasts />
    </div>
  );
}

export default App;
