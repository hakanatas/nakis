import type { EmbroideryDocument } from './document';
import { drawHoopBorder, fillFabric } from './fabric';
import { clamp } from './geom';
import { drawPreview, drawStitches } from './render';
import type { FabricTextureResult, Point, Primitive, Stitch } from './types';
import type { ViewState, Viewport } from './viewport';

const SETTLE_MS = 160;

export interface OverlayState {
  preview: Primitive[] | null;
  previewColor: string;
  looseTail: number;
  needle: { pos: Point; angle: number; visible: boolean; puncture: number; thread: string };
  eraser: { pos: Point; r: number; visible: boolean };
  showGrid: boolean;
  gridEmphasis: number;
}

/**
 * Three stacked canvases: fabric (cheap, redrawn on view change), stitches (cached bitmap,
 * re-rendered lazily) and overlay (preview stroke, needle, eraser ring, grid).
 */
export class CanvasRenderer {
  dpr = 1;
  width = 0;
  height = 0;

  overlay: OverlayState = {
    preview: null,
    previewColor: '#000',
    looseTail: 0,
    needle: { pos: { x: -100, y: -100 }, angle: -Math.PI * 0.75, visible: false, puncture: 0, thread: '#000' },
    eraser: { pos: { x: 0, y: 0 }, r: 8, visible: false },
    showGrid: false,
    gridEmphasis: 1,
  };

  private cache = document.createElement('canvas');
  private cacheView: ViewState | null = null;
  private settling: { stitch: Stitch; start: number }[] = [];
  private raf = 0;
  private viewDirty = true;
  private stitchesDirty = true;
  private overlayDirty = true;
  private fullRedrawTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubs: (() => void)[] = [];
  private fabricCtx: CanvasRenderingContext2D;
  private stitchCtx: CanvasRenderingContext2D;
  private overlayCtx: CanvasRenderingContext2D;

  constructor(
    private doc: EmbroideryDocument,
    private vp: Viewport,
    private fabricCanvas: HTMLCanvasElement,
    private stitchCanvas: HTMLCanvasElement,
    private overlayCanvas: HTMLCanvasElement,
    private fabric: FabricTextureResult,
  ) {
    this.fabricCtx = fabricCanvas.getContext('2d')!;
    this.stitchCtx = stitchCanvas.getContext('2d')!;
    this.overlayCtx = overlayCanvas.getContext('2d')!;
    this.unsubs.push(vp.subscribe(() => this.onViewChanged()));
  }

  dispose(): void {
    for (const u of this.unsubs) u();
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.fullRedrawTimer) clearTimeout(this.fullRedrawTimer);
  }

  setFabric(fabric: FabricTextureResult): void {
    this.fabric = fabric;
    this.viewDirty = true;
    this.requestFrame();
  }

  resize(width: number, height: number, dpr: number): void {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    for (const c of [this.fabricCanvas, this.stitchCanvas, this.overlayCanvas, this.cache]) {
      c.width = Math.max(1, Math.round(width * dpr));
      c.height = Math.max(1, Math.round(height * dpr));
    }
    this.viewDirty = true;
    this.stitchesDirty = true;
    this.overlayDirty = true;
    this.requestFrame();
  }

  requestFrame(): void {
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  invalidateStitches(): void {
    this.stitchesDirty = true;
    this.requestFrame();
  }

  invalidateOverlay(): void {
    this.overlayDirty = true;
    this.requestFrame();
  }

  private onViewChanged(): void {
    this.viewDirty = true;
    this.overlayDirty = true;
    if (this.doc.count < 250) {
      this.stitchesDirty = true;
    } else {
      // Large documents: scale the cached bitmap while interacting, re-render after a pause.
      if (this.fullRedrawTimer) clearTimeout(this.fullRedrawTimer);
      this.fullRedrawTimer = setTimeout(() => {
        this.fullRedrawTimer = null;
        this.stitchesDirty = true;
        this.requestFrame();
      }, 90);
    }
    this.requestFrame();
  }

  /** Animates a freshly committed stitch being pulled tight before it joins the cache. */
  settle(stitch: Stitch): void {
    this.settling.push({ stitch, start: performance.now() });
    this.requestFrame();
  }

  private frame(t: number): void {
    this.raf = 0;
    if (this.viewDirty) this.drawFabric();
    if (this.stitchesDirty) {
      this.renderCache();
      this.blitCache();
      this.stitchesDirty = false;
    } else if (this.viewDirty) {
      this.blitCache();
    }
    const viewWasDirty = this.viewDirty;
    this.viewDirty = false;
    const animating = this.settling.length > 0 || this.overlay.needle.puncture > 0.01;
    if (this.overlayDirty || viewWasDirty || animating) {
      this.drawOverlay(t);
      this.overlayDirty = false;
    }
    if (animating) this.requestFrame();
  }

  private applyDocTransform(ctx: CanvasRenderingContext2D, view: ViewState = this.vp): void {
    const d = this.dpr;
    ctx.setTransform(d * view.scale, 0, 0, d * view.scale, d * view.tx, d * view.ty);
  }

  private drawFabric(): void {
    const ctx = this.fabricCtx;
    const dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    this.applyDocTransform(ctx);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const r = this.vp.visibleRect();
    fillFabric(ctx, this.fabric, r.x - 1, r.y - 1, r.w + 2, r.h + 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawHoopBorder(ctx, 0, 0, this.width, this.height, 1);
  }

  private renderCache(): void {
    const ctx = this.cache.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.cache.width, this.cache.height);
    this.applyDocTransform(ctx);
    const settlingIds = new Set(this.settling.map((s) => s.stitch.id));
    const visible = this.doc.queryRect(this.vp.visibleRect()).filter((s) => !settlingIds.has(s.id));
    drawStitches(ctx, visible, { quality: this.vp.scale < 0.45 ? 'fast' : 'full' });
    this.cacheView = this.vp.state();
  }

  private appendToCache(stitch: Stitch): void {
    if (!this.cacheView) return;
    const ctx = this.cache.getContext('2d')!;
    this.applyDocTransform(ctx, this.cacheView);
    drawStitches(ctx, [stitch], { quality: 'full' });
  }

  private blitCache(): void {
    const ctx = this.stitchCtx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (!this.cacheView) return;
    const cv = this.cacheView;
    const vp = this.vp;
    const k = vp.scale / cv.scale;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.transform(k, 0, 0, k, vp.tx - k * cv.tx, vp.ty - k * cv.ty);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.cache, 0, 0, this.cache.width / dpr, this.cache.height / dpr);
  }

  private drawOverlay(t: number): void {
    const ctx = this.overlayCtx;
    const ov = this.overlay;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    if (ov.showGrid) this.drawGrid(ctx);

    if (this.settling.length) {
      this.applyDocTransform(ctx);
      const finished: { stitch: Stitch; start: number }[] = [];
      for (const s of this.settling) {
        const p = clamp((t - s.start) / SETTLE_MS, 0, 1);
        const loose = 1 - p * p * (3 - 2 * p);
        drawStitches(ctx, [s.stitch], { quality: 'full', loose });
        if (p >= 1) finished.push(s);
      }
      if (finished.length) {
        this.settling = this.settling.filter((s) => !finished.includes(s));
        for (const s of finished) {
          if (this.doc.get(s.stitch.id)) this.appendToCache(s.stitch);
        }
        this.blitCache();
      }
    }

    if (ov.preview && ov.preview.length) {
      this.applyDocTransform(ctx);
      drawPreview(ctx, ov.preview, ov.previewColor, { quality: 'full', looseTail: ov.looseTail });
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (ov.eraser.visible) {
      const e = ov.eraser;
      const r = e.r * this.vp.scale;
      ctx.beginPath();
      ctx.arc(e.pos.x, e.pos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201, 82, 74, 0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(201, 82, 74, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (ov.needle.visible) {
      this.drawNeedle(ctx, ov.needle);
      ov.needle.puncture *= 0.78;
    }
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const vp = this.vp;
    let step = this.doc.gridSize;
    while (step * vp.scale < 7) step *= 2;
    const r = vp.visibleRect();
    const x0 = Math.floor(r.x / step) * step;
    const x1 = r.x + r.w;
    const y0 = Math.floor(r.y / step) * step;
    const y1 = r.y + r.h;
    this.applyDocTransform(ctx);
    ctx.lineWidth = 1 / vp.scale;
    const k = this.overlay.gridEmphasis;
    ctx.strokeStyle = `rgba(104, 84, 60, ${0.14 * k})`;
    ctx.beginPath();
    for (let x = x0; x <= x1 + 0.01; x += step) {
      ctx.moveTo(x, r.y);
      ctx.lineTo(x, y1);
    }
    for (let y = y0; y <= y1 + 0.01; y += step) {
      ctx.moveTo(r.x, y);
      ctx.lineTo(x1, y);
    }
    ctx.stroke();
  }

  private drawNeedle(ctx: CanvasRenderingContext2D, n: OverlayState['needle']): void {
    const len = 54 * (1 - 0.12 * n.puncture);
    ctx.save();
    ctx.translate(n.pos.x, n.pos.y);
    ctx.rotate(n.angle);
    ctx.lineCap = 'round';

    // trailing thread
    ctx.strokeStyle = n.thread;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-len + 7, 0);
    ctx.quadraticCurveTo(-len - 10, 9, -len - 26, 3);
    ctx.stroke();

    // shadow
    ctx.strokeStyle = 'rgba(60, 44, 28, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-len + 3, 3.5);
    ctx.lineTo(-3, 3.5);
    ctx.stroke();

    // shaft
    const grad = ctx.createLinearGradient(0, -1.7, 0, 1.7);
    grad.addColorStop(0, '#f6f6f4');
    grad.addColorStop(0.45, '#c3c6c9');
    grad.addColorStop(1, '#6a6f74');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.7;
    ctx.beginPath();
    ctx.moveTo(-len, 0);
    ctx.lineTo(-6, 0);
    ctx.stroke();

    // tip
    ctx.fillStyle = '#9ea2a6';
    ctx.beginPath();
    ctx.moveTo(-8, -1.35);
    ctx.lineTo(0, 0);
    ctx.lineTo(-8, 1.35);
    ctx.closePath();
    ctx.fill();

    // eye
    ctx.fillStyle = '#f4f2ee';
    ctx.strokeStyle = '#5b6065';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(-len + 7, 0, 1.1, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
