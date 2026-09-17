import { useEffect, useState } from 'react';
import { STITCH_TYPES } from '../core/constants';
import { useEditor, useEditorState } from './context';

export type LayoutMode = 'desktop' | 'tablet' | 'mobile';

function modeFor(width: number): LayoutMode {
  return width >= 1180 ? 'desktop' : width >= 720 ? 'tablet' : 'mobile';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(() => modeFor(window.innerWidth));
  useEffect(() => {
    const onResize = () => setMode(modeFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mode;
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

/** Global keyboard shortcuts. */
export function useShortcuts(): void {
  const editor = useEditor();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        editor.redo();
        return;
      }
      if (mod && key === 's') {
        e.preventDefault();
        void editor.save();
        return;
      }
      if (mod) return;
      switch (key) {
        case 'n':
          editor.setTool('needle');
          break;
        case 'e':
          editor.setTool('eraser');
          break;
        case 'h':
          editor.setTool('pan');
          break;
        case 'z':
          editor.setTool('zoom');
          break;
        case 'i':
          editor.setTool(editor.store.get().tool === 'eyedropper' ? 'needle' : 'eyedropper');
          break;
        case 'g':
          editor.toggleGrid();
          break;
        case 'f':
          editor.fit();
          break;
        case '=':
        case '+':
          editor.zoomBy(1.25);
          break;
        case '-':
          editor.zoomBy(0.8);
          break;
        case 'escape':
          if (editor.store.get().tool === 'eyedropper') editor.setTool('needle');
          break;
        default: {
          const n = Number(e.key);
          if (n >= 1 && n <= STITCH_TYPES.length) editor.setStitchType(STITCH_TYPES[n - 1]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);
}

export function Toast() {
  const toast = useEditorState((s) => s.toast);
  return (
    <div className={'toast' + (toast ? ' is-visible' : '')} role="status" aria-live="polite">
      {toast?.text}
    </div>
  );
}
