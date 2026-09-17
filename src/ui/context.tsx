import { createContext, useContext, useSyncExternalStore } from 'react';
import type { Editor, EditorState } from '../core/editor';

export const EditorContext = createContext<Editor | null>(null);

export function useEditor(): Editor {
  const editor = useContext(EditorContext);
  if (!editor) throw new Error('EditorContext missing');
  return editor;
}

/** Subscribes to a slice of the editor state. */
export function useEditorState<T>(selector: (s: EditorState) => T): T {
  const editor = useEditor();
  return useSyncExternalStore(
    editor.store.subscribe,
    () => selector(editor.store.get()),
    () => selector(editor.store.get()),
  );
}
