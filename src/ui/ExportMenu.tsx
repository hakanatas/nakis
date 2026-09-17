import { useEffect, useRef, useState } from 'react';
import { useEditor } from './context';
import { ExportIcon } from './icons';

interface Props {
  compact?: boolean;
  direction?: 'down' | 'up';
}

export function ExportMenu({ compact = false, direction = 'down' }: Props) {
  const editor = useEditor();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="btn btn--export"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Export"
      >
        <ExportIcon />
        {!compact && <span>Export</span>}
      </button>
      {open && (
        <div className={'menu__pop menu__pop--' + direction} role="menu">
          <div className="menu__label">Export</div>
          <button type="button" role="menuitem" onClick={pick(() => void editor.exportPNG(1))}>
            PNG image <small>1x</small>
          </button>
          <button type="button" role="menuitem" onClick={pick(() => void editor.exportPNG(3))}>
            High resolution PNG <small>3x</small>
          </button>
          <button type="button" role="menuitem" onClick={pick(() => void editor.exportJSON())}>
            Project JSON <small>editable</small>
          </button>
          <div className="menu__label">Project</div>
          <button type="button" role="menuitem" onClick={pick(() => fileRef.current?.click())}>
            Import project JSON
          </button>
          {compact && (
            <button type="button" role="menuitem" onClick={pick(() => editor.reset())}>
              Reset to default template
            </button>
          )}
          <button type="button" role="menuitem" className="menu__danger" onClick={pick(() => editor.clearAll())}>
            Clear canvas
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void editor.importJSON(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
