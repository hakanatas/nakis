import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { renderDocument } from '../core/export';
import type { Rect } from '../core/types';
import { useEditor, useEditorState } from './context';
import { Panel } from './Panel';

/** Minimap of the whole cloth with the visible area outlined; click to recentre. */
export function Preview({ size = 240 }: { size?: number }) {
  const editor = useEditor();
  const revision = useEditorState((s) => s.revision);
  const fabricVersion = useEditorState((s) => s.fabricVersion);
  const zoom = useEditorState((s) => s.zoom);
  const ready = useEditorState((s) => s.ready);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rectRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<Rect>(editor.doc.frame());

  const dims = (f: Rect) => {
    const k = Math.min(size / f.w, size / f.h);
    return { width: Math.round(f.w * k), height: Math.round(f.h * k) };
  };
  const [dim, setDim] = useState(() => dims(frameRef.current));
  const ratioKey = `${dim.width} / ${dim.height}`;
  const doc = editor.doc;

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const f = doc.frame();
      frameRef.current = f;
      setDim(dims(f));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = (size * dpr) / Math.max(f.w, f.h);
      const img = renderDocument(doc, editor.fabric, scale, f);
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      updateRect();
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [revision, fabricVersion, ready, size, doc, editor]);

  const updateRect = () => {
    const rect = rectRef.current;
    const wrap = wrapRef.current;
    if (!rect || !wrap) return;
    const vp = editor.viewport;
    if (vp.width === 0) return;
    const f = frameRef.current;
    const vis = vp.visibleRect();
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    const x0 = (Math.max(f.x, vis.x) - f.x) / f.w;
    const y0 = (Math.max(f.y, vis.y) - f.y) / f.h;
    const x1 = (Math.min(f.x + f.w, vis.x + vis.w) - f.x) / f.w;
    const y1 = (Math.min(f.y + f.h, vis.y + vis.h) - f.y) / f.h;
    const wholeVisible = x0 <= 0.001 && y0 <= 0.001 && x1 >= 0.999 && y1 >= 0.999;
    rect.style.opacity = wholeVisible || x1 <= x0 || y1 <= y0 ? '0' : '1';
    rect.style.transform = `translate(${x0 * W}px, ${y0 * H}px)`;
    rect.style.width = Math.max(0, (x1 - x0) * W) + 'px';
    rect.style.height = Math.max(0, (y1 - y0) * H) + 'px';
  };

  useEffect(() => {
    updateRect();
    return editor.viewport.subscribe(updateRect);
  }, [editor, zoom, ratioKey]);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const f = frameRef.current;
    const x = f.x + ((e.clientX - r.left) / r.width) * f.w;
    const y = f.y + ((e.clientY - r.top) / r.height) * f.h;
    editor.viewport.centerOn({ x, y });
  };

  return (
    <Panel title="Preview" className="panel--preview">
      <div
        className="preview"
        ref={wrapRef}
        style={{ width: dim.width, height: dim.height }}
        onClick={onClick}
        title="Click to center the view here"
      >
        <canvas ref={canvasRef} className="preview__img" />
        <div ref={rectRef} className="preview__rect" />
      </div>
    </Panel>
  );
}
