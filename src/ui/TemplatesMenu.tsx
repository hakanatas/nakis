import { useEffect, useRef, useState } from 'react';
import { EmbroideryDocument } from '../core/document';
import { renderDocument } from '../core/export';
import type { FabricTextureResult } from '../core/types';
import { TEMPLATES, type Template, type TemplateGroup } from '../templates';
import { useEditor } from './context';
import { TemplatesIcon } from './icons';

const thumbCache = new Map<string, string>();

const GROUPS: { group: TemplateGroup; label: string }[] = [
  { group: 'endemic', label: 'Türkiye’nin endemik türleri' },
  { group: 'classic', label: 'Klasik desenler' },
];

function templateThumb(t: Template, fabric: FabricTextureResult): string {
  const cached = thumbCache.get(t.id);
  if (cached) return cached;
  const doc = new EmbroideryDocument();
  doc.load(t.build());
  const f = doc.frame(30);
  const size = Math.max(f.w, f.h);
  const square = { x: f.x + f.w / 2 - size / 2, y: f.y + f.h / 2 - size / 2, w: size, h: size };
  const url = renderDocument(doc, fabric, 220 / size, square).toDataURL('image/png');
  thumbCache.set(t.id, url);
  return url;
}

interface Props {
  compact?: boolean;
  onLoaded?: () => void;
}

export function TemplatesMenu({ compact = false, onLoaded }: Props) {
  const editor = useEditor();
  const [open, setOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let i = 0;
    // Render thumbnails one per frame so the menu opens without a hitch.
    const next = () => {
      if (cancelled || i >= TEMPLATES.length) return;
      const t = TEMPLATES[i++];
      const url = templateThumb(t, editor.fabric);
      setThumbs((prev) => (prev[t.id] === url ? prev : { ...prev, [t.id]: url }));
      requestAnimationFrame(next);
    };
    requestAnimationFrame(next);

    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, editor]);

  return (
    <div className="menu" ref={ref}>
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Templates"
      >
        <TemplatesIcon />
        {!compact && <span>Templates</span>}
      </button>
      {open && (
        <div className="menu__pop menu__pop--down templates" role="menu">
          {GROUPS.map(({ group, label }) => (
            <div key={group} className="templates__group">
              <div className="menu__label">{label}</div>
              <div className="templates__grid">
                {TEMPLATES.filter((t) => t.group === group).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitem"
                    className="template"
                    onClick={() => {
                      setOpen(false);
                      editor.loadTemplate(t.id);
                      onLoaded?.();
                    }}
                  >
                    <span className="template__thumb">
                      {thumbs[t.id] ? <img src={thumbs[t.id]} alt="" /> : <span className="template__skeleton" />}
                      {t.species && (
                        <span className="template__emoji" aria-hidden="true">
                          {t.species.emoji}
                        </span>
                      )}
                    </span>
                    <span className="template__name">{t.name}</span>
                    <span className="template__desc">{t.description}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="templates__hint">Loading a template replaces the cloth. Undo brings your work back.</p>
        </div>
      )}
    </div>
  );
}
