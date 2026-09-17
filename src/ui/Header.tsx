import type { ReactNode } from 'react';
import { useEditor, useEditorState } from './context';
import { ExportMenu } from './ExportMenu';
import { Logo, RedoIcon, ResetIcon, SaveIcon, UndoIcon } from './icons';
import { TemplatesMenu } from './TemplatesMenu';

interface Props {
  compact?: boolean;
  trailing?: ReactNode;
}

export function Header({ compact = false, trailing }: Props) {
  const editor = useEditor();
  const canUndo = useEditorState((s) => s.canUndo);
  const canRedo = useEditorState((s) => s.canRedo);
  const dirty = useEditorState((s) => s.dirty);
  const saving = useEditorState((s) => s.saving);

  return (
    <header className={'header' + (compact ? ' header--compact' : '')}>
      <div className="brand">
        <Logo size={compact ? 40 : 60} />
        <div className="brand__text">
          <h1 className="brand__title">StitchCraft</h1>
          {!compact && <p className="brand__sub">Turn Ideas Into Stitches</p>}
        </div>
      </div>
      <div className="header__spacer" />
      <div className="history">
        <button
          type="button"
          className="history__btn"
          onClick={() => editor.undo()}
          disabled={!canUndo}
          title="Undo (Ctrl/Cmd+Z)"
          aria-label="Undo"
        >
          <UndoIcon />
          {!compact && <span>Undo</span>}
        </button>
        <button
          type="button"
          className="history__btn"
          onClick={() => editor.redo()}
          disabled={!canRedo}
          title="Redo (Ctrl/Cmd+Shift+Z)"
          aria-label="Redo"
        >
          <RedoIcon />
          {!compact && <span>Redo</span>}
        </button>
      </div>
      <TemplatesMenu compact={compact} />
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => editor.reset()}
        title="Reset to the default template"
        aria-label="Reset"
      >
        <ResetIcon />
        {!compact && <span>Reset</span>}
      </button>
      <button
        type="button"
        className={'btn btn--save' + (dirty ? ' btn--dirty' : '')}
        onClick={() => void editor.save()}
        disabled={saving}
        title="Save to this browser (Ctrl/Cmd+S)"
      >
        <SaveIcon />
        {!compact && <span>{saving ? 'Saving' : 'Save'}</span>}
        {dirty && <span className="btn__dot" aria-label="Unsaved changes" />}
      </button>
      <ExportMenu compact={compact} />
      {trailing}
    </header>
  );
}
