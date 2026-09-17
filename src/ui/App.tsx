import { useCallback, useEffect, useMemo, useState } from 'react';
import { Editor } from '../core/editor';
import { EditorContext, useEditorState } from './context';
import { Header } from './Header';
import { useLayoutMode, useShortcuts, Toast } from './hooks';
import { PaletteIcon, StitchGlyph } from './icons';
import { MobileBar, MobileSheets, MobileTop, type MobileSheetId } from './mobile';
import { Drawer } from './overlays';
import { SettingsPanel, StitchModePanel, ThreadColorsPanel, ToolsPanel } from './panels';
import { Preview } from './Preview';
import { Stage } from './Stage';

function DesktopLayout() {
  return (
    <div className="app app--desktop">
      <Header />
      <div className="app__body">
        <aside className="sidebar sidebar--left">
          <StitchModePanel />
          <ToolsPanel />
        </aside>
        <main className="workspace">
          <Stage />
        </main>
        <aside className="sidebar sidebar--right">
          <ThreadColorsPanel />
          <SettingsPanel />
          <Preview />
        </aside>
      </div>
    </div>
  );
}

function TabletLayout() {
  const [drawer, setDrawer] = useState<'left' | 'right' | null>(null);
  const close = useCallback(() => setDrawer(null), []);
  const stitchType = useEditorState((s) => s.stitchType);
  const color = useEditorState((s) => s.color);
  return (
    <div className="app app--tablet">
      <Header
        compact
        trailing={
          <>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDrawer('left')}
              title="Stitch mode and tools"
              aria-label="Stitch mode and tools"
            >
              <span className="stitch-mini">
                <StitchGlyph type={stitchType} width={40} height={20} />
              </span>
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setDrawer('right')}
              title="Thread colors and settings"
              aria-label="Thread colors and settings"
            >
              <span className="mbar__color" style={{ background: color }} />
              <PaletteIcon size={20} />
            </button>
          </>
        }
      />
      <div className="app__body">
        <main className="workspace">
          <Stage />
        </main>
      </div>
      <Drawer open={drawer === 'left'} side="left" title="Stitches and Tools" onClose={close}>
        <StitchModePanel />
        <ToolsPanel />
      </Drawer>
      <Drawer open={drawer === 'right'} side="right" title="Thread and Settings" onClose={close}>
        <ThreadColorsPanel />
        <SettingsPanel />
        <Preview size={220} />
      </Drawer>
    </div>
  );
}

function MobileLayout() {
  const [sheet, setSheet] = useState<MobileSheetId | null>(null);
  const close = useCallback(() => setSheet(null), []);
  return (
    <div className="app app--mobile">
      <MobileTop />
      <main className="workspace">
        <Stage />
      </main>
      <MobileBar onOpen={setSheet} />
      <MobileSheets open={sheet} onClose={close} />
    </div>
  );
}

function App() {
  const mode = useLayoutMode();
  useShortcuts();
  return (
    <>
      {mode === 'desktop' && <DesktopLayout />}
      {mode === 'tablet' && <TabletLayout />}
      {mode === 'mobile' && <MobileLayout />}
      <Toast />
    </>
  );
}

export function Root() {
  const editor = useMemo(() => new Editor(), []);
  useEffect(() => {
    void editor.init();
    return () => editor.dispose();
  }, [editor]);
  return (
    <EditorContext.Provider value={editor}>
      <App />
    </EditorContext.Provider>
  );
}
