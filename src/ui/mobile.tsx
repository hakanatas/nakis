import { STITCH_LABELS } from '../core/constants';
import { useEditor, useEditorState } from './context';
import { ExportMenu } from './ExportMenu';
import { LeafIcon, Logo, RedoIcon, SaveIcon, SettingsIcon, StitchGlyph, TOOL_ICONS, UndoIcon } from './icons';
import { Sheet } from './overlays';
import { SettingsFields, StitchModeList, Swatches, ToolList } from './panels';
import { Preview } from './Preview';
import { SpeciesPanel } from './SpeciesPanel';
import { TemplatesMenu } from './TemplatesMenu';

export type MobileSheetId = 'stitch' | 'color' | 'tools' | 'settings' | 'species';

export function MobileTop({ onOpen }: { onOpen: (id: MobileSheetId) => void }) {
  const editor = useEditor();
  const canUndo = useEditorState((s) => s.canUndo);
  const canRedo = useEditorState((s) => s.canRedo);
  const saving = useEditorState((s) => s.saving);
  const dirty = useEditorState((s) => s.dirty);
  return (
    <header className="mtop">
      <Logo size={34} />
      <span className="mtop__title">StitchCraft</span>
      <div className="header__spacer" />
      <TemplatesMenu compact />
      <button type="button" className="iconbtn" onClick={() => onOpen('species')} aria-label="Tür bilgisi" title="Tür bilgisi">
        <LeafIcon size={20} />
      </button>
      <button type="button" className="iconbtn" onClick={() => editor.undo()} disabled={!canUndo} aria-label="Undo">
        <UndoIcon size={20} />
      </button>
      <button type="button" className="iconbtn" onClick={() => editor.redo()} disabled={!canRedo} aria-label="Redo">
        <RedoIcon size={20} />
      </button>
      <button
        type="button"
        className={'iconbtn' + (dirty ? ' iconbtn--dirty' : '')}
        onClick={() => void editor.save()}
        disabled={saving}
        aria-label="Save"
      >
        <SaveIcon size={20} />
      </button>
      <ExportMenu compact />
    </header>
  );
}

export function MobileBar({ onOpen }: { onOpen: (id: MobileSheetId) => void }) {
  const editor = useEditor();
  const tool = useEditorState((s) => s.tool);
  const stitchType = useEditorState((s) => s.stitchType);
  const color = useEditorState((s) => s.color);
  const Needle = TOOL_ICONS.needle;
  const Eraser = TOOL_ICONS.eraser;
  const Hand = TOOL_ICONS.pan;
  return (
    <nav className="mbar" aria-label="Toolbar">
      <button type="button" className="mbar__btn" onClick={() => onOpen('stitch')} title={STITCH_LABELS[stitchType]}>
        <span className="mbar__stitch">
          <StitchGlyph type={stitchType} width={44} height={22} />
        </span>
        <span>Stitch</span>
      </button>
      <button type="button" className="mbar__btn" onClick={() => onOpen('color')} title="Thread color">
        <span className="mbar__color" style={{ background: color }} />
        <span>Thread</span>
      </button>
      <button
        type="button"
        className={'mbar__btn' + (tool === 'needle' ? ' is-active' : '')}
        onClick={() => editor.setTool('needle')}
        aria-pressed={tool === 'needle'}
      >
        <Needle />
        <span>Needle</span>
      </button>
      <button
        type="button"
        className={'mbar__btn' + (tool === 'eraser' ? ' is-active' : '')}
        onClick={() => editor.setTool('eraser')}
        aria-pressed={tool === 'eraser'}
      >
        <Eraser />
        <span>Eraser</span>
      </button>
      <button
        type="button"
        className={'mbar__btn' + (tool === 'pan' || tool === 'zoom' ? ' is-active' : '')}
        onClick={() => editor.setTool('pan')}
        aria-pressed={tool === 'pan'}
      >
        <Hand />
        <span>Pan</span>
      </button>
      <button type="button" className="mbar__btn" onClick={() => onOpen('settings')}>
        <SettingsIcon />
        <span>Settings</span>
      </button>
    </nav>
  );
}

export function MobileSheets({ open, onClose }: { open: MobileSheetId | null; onClose: () => void }) {
  return (
    <>
      <Sheet open={open === 'stitch'} title="Stitch Mode" onClose={onClose}>
        <StitchModeList onPick={onClose} />
      </Sheet>
      <Sheet open={open === 'color'} title="Thread Colors" onClose={onClose}>
        <Swatches onPick={onClose} />
      </Sheet>
      <Sheet open={open === 'tools'} title="Tools" onClose={onClose}>
        <ToolList onPick={onClose} />
      </Sheet>
      <Sheet open={open === 'species'} title="Tür Bilgisi" onClose={onClose}>
        <div className="sheet__species">
          <SpeciesPanel />
        </div>
      </Sheet>
      <Sheet open={open === 'settings'} title="Stitch Settings" onClose={onClose}>
        <SettingsFields />
        <div className="sheet__preview">
          <Preview size={200} />
        </div>
      </Sheet>
    </>
  );
}
