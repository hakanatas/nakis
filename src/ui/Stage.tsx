import { useEffect, useRef } from 'react';
import { useEditor, useEditorState } from './context';
import { FitIcon, MinusIcon, PlusIcon } from './icons';

/** The drawing surface: three stacked canvases plus zoom controls and the stitch counter. */
export function Stage() {
  const editor = useEditor();
  const stageRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<HTMLCanvasElement>(null);
  const stitchRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const zoom = useEditorState((s) => s.zoom);
  const ready = useEditorState((s) => s.ready);
  const count = useEditorState((s) => s.stitchCount);

  useEffect(() => {
    const stage = stageRef.current;
    const fabric = fabricRef.current;
    const stitch = stitchRef.current;
    const overlay = overlayRef.current;
    if (!stage || !fabric || !stitch || !overlay) return;
    editor.attach(stage, fabric, stitch, overlay);

    let first = true;
    let dpr = window.devicePixelRatio || 1;
    const measure = () => {
      const r = stage.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      for (const c of [fabric, stitch, overlay]) {
        c.style.width = w + 'px';
        c.style.height = h + 'px';
      }
      editor.resize(w, h, dpr, first);
      first = false;
    };
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    measure();

    let mq: MediaQueryList | null = null;
    const watchDpr = () => {
      mq?.removeEventListener('change', onDprChange);
      mq = window.matchMedia(`(resolution: ${dpr}dppx)`);
      mq.addEventListener('change', onDprChange);
    };
    const onDprChange = () => {
      dpr = window.devicePixelRatio || 1;
      measure();
      watchDpr();
    };
    watchDpr();

    return () => {
      ro.disconnect();
      mq?.removeEventListener('change', onDprChange);
      editor.detach();
    };
  }, [editor]);

  return (
    <div className="stage-wrap">
      <div
        ref={stageRef}
        className="stage"
        data-tool="needle"
        data-active="false"
        aria-label="Embroidery canvas"
        role="img"
      >
        <canvas ref={fabricRef} className="stage__layer" />
        <canvas ref={stitchRef} className="stage__layer" />
        <canvas ref={overlayRef} className="stage__layer" />
        {!ready && <div className="stage__loading">Preparing the fabric</div>}
      </div>
      <div className="zoombar" role="group" aria-label="Zoom">
        <button type="button" onClick={() => editor.zoomBy(1 / 1.25)} title="Zoom out (-)" aria-label="Zoom out">
          <MinusIcon />
        </button>
        <button type="button" className="zoombar__pct" onClick={() => editor.fit()} title="Fit to canvas (F)">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => editor.zoomBy(1.25)} title="Zoom in (+)" aria-label="Zoom in">
          <PlusIcon />
        </button>
        <span className="zoombar__sep" />
        <button type="button" onClick={() => editor.fit()} title="Fit to canvas (F)" aria-label="Fit to canvas">
          <FitIcon />
        </button>
      </div>
      <div className="stage__count" aria-live="polite">
        {count} {count === 1 ? 'stitch' : 'stitches'}
      </div>
    </div>
  );
}
