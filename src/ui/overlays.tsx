import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './icons';

function useEscape(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet used on phones. */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  useEscape(open, onClose);
  return (
    <div className={'sheet' + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="sheet__backdrop" onClick={onClose} />
      <div className="sheet__body" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet__grip" />
        <div className="sheet__head">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="sheet__content">{children}</div>
      </div>
    </div>
  );
}

interface DrawerProps extends SheetProps {
  side: 'left' | 'right';
}

/** Side drawer used on tablets. */
export function Drawer({ open, side, title, onClose, children }: DrawerProps) {
  useEscape(open, onClose);
  return (
    <div className={'drawer drawer--' + side + (open ? ' is-open' : '')} aria-hidden={!open}>
      <div className="drawer__backdrop" onClick={onClose} />
      <aside className="drawer__body" role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer__head">
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="drawer__content">{children}</div>
      </aside>
    </div>
  );
}
