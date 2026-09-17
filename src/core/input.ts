import type { Editor } from './editor';
import { dist, lerpAngle } from './geom';
import type { Point, Tool } from './types';

type Mode = 'idle' | 'draw' | 'erase' | 'pan' | 'zoom' | 'pinch';

interface PointerInfo {
  x: number;
  y: number;
  type: string;
}

/** Translates pointer / wheel / keyboard events on the stage into editor actions. */
export class InputController {
  private pointers = new Map<number, PointerInfo>();
  private mode: Mode = 'idle';
  private raw: Point[] = [];
  private panLast: Point = { x: 0, y: 0 };
  private pinchPrev: { mid: Point; d: number } | null = null;
  private zoomStart: { screen: Point; scale: number } | null = null;
  private moved = false;
  private spaceDown = false;
  private previewRaf = 0;
  private lastPrimCount = 0;
  private lastMove: { p: Point; t: number } | null = null;
  private disposers: (() => void)[] = [];

  constructor(
    private editor: Editor,
    private el: HTMLElement,
  ) {
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      fn: (e: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions,
    ) => {
      el.addEventListener(type, fn, opts);
      this.disposers.push(() => el.removeEventListener(type, fn, opts));
    };
    on('pointerdown', (e) => this.onDown(e));
    on('pointermove', (e) => this.onMove(e));
    on('pointerup', (e) => this.onUp(e));
    on('pointercancel', (e) => this.onUp(e));
    on('pointerleave', () => this.onLeave());
    on('wheel', (e) => this.onWheel(e), { passive: false });
    on('contextmenu', (e) => e.preventDefault());

    const keyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !this.isTyping(e)) {
        this.spaceDown = true;
        this.updateCursorClass();
        e.preventDefault();
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
        this.updateCursorClass();
      }
    };
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    this.disposers.push(() => window.removeEventListener('keydown', keyDown));
    this.disposers.push(() => window.removeEventListener('keyup', keyUp));
    this.disposers.push(this.editor.store.subscribe(() => this.updateCursorClass()));
    this.updateCursorClass();
  }

  dispose(): void {
    for (const d of this.disposers) d();
    if (this.previewRaf) cancelAnimationFrame(this.previewRaf);
  }

  private isTyping(e: Event): boolean {
    const t = e.target as HTMLElement | null;
    return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  }

  private local(e: PointerEvent | WheelEvent): Point {
    const r = this.el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private effectiveTool(e: PointerEvent): Tool {
    return this.spaceDown || e.button === 1 ? 'pan' : this.editor.store.get().tool;
  }

  private updateCursorClass(): void {
    const tool = this.spaceDown || this.mode === 'pan' ? 'pan' : this.editor.store.get().tool;
    this.el.dataset.tool = tool;
    this.el.dataset.active = this.mode !== 'idle' ? 'true' : 'false';
  }

  private eraserRadius(): number {
    return Math.max(4, 9 / this.editor.viewport.scale);
  }

  private onDown(e: PointerEvent): void {
    const renderer = this.editor.renderer;
    if (!renderer || (e.button !== 0 && e.button !== 1)) return;
    this.el.setPointerCapture(e.pointerId);
    const s = this.local(e);
    this.pointers.set(e.pointerId, { x: s.x, y: s.y, type: e.pointerType });
    if (e.pointerType === 'touch' && this.pointers.size === 2) {
      this.cancelGesture();
      this.mode = 'pinch';
      this.pinchPrev = null;
      this.updateCursorClass();
      return;
    }
    if (this.pointers.size > 1) return;

    const vp = this.editor.viewport;
    const d = vp.toDoc(s);
    const tool = this.effectiveTool(e);
    this.moved = false;
    switch (tool) {
      case 'needle':
        this.mode = 'draw';
        this.raw = [d];
        this.lastPrimCount = 0;
        renderer.overlay.needle.puncture = 1;
        this.updateNeedle(s, e);
        this.schedulePreview();
        break;
      case 'eraser':
        this.mode = 'erase';
        this.editor.beginErase();
        this.editor.eraseAt(d, this.eraserRadius());
        renderer.overlay.eraser = { pos: s, r: this.eraserRadius(), visible: e.pointerType !== 'touch' };
        renderer.invalidateOverlay();
        break;
      case 'pan':
        this.mode = 'pan';
        this.panLast = s;
        break;
      case 'zoom':
        this.mode = 'zoom';
        this.zoomStart = { screen: s, scale: vp.scale };
        break;
      case 'eyedropper': {
        const color = this.editor.pickColorAt(d, this.eraserRadius());
        if (color) {
          this.editor.setColor(color);
          this.editor.setTool('needle');
          this.editor.toast('Thread colour picked');
        } else {
          this.editor.toast('No thread under the pointer');
        }
        break;
      }
    }
    this.updateCursorClass();
  }

  private onMove(e: PointerEvent): void {
    const renderer = this.editor.renderer;
    if (!renderer) return;
    const s = this.local(e);
    const info = this.pointers.get(e.pointerId);
    if (info) {
      info.x = s.x;
      info.y = s.y;
    }
    const vp = this.editor.viewport;

    if (this.mode === 'pinch') {
      if (this.pointers.size >= 2) {
        const [a, b] = Array.from(this.pointers.values());
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const d = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
        if (this.pinchPrev) {
          vp.panBy(mid.x - this.pinchPrev.mid.x, mid.y - this.pinchPrev.mid.y);
          vp.zoomAt(mid, d / this.pinchPrev.d);
        }
        this.pinchPrev = { mid, d };
      }
      return;
    }

    const tool = this.editor.store.get().tool;
    if (tool === 'needle' && e.pointerType !== 'touch') this.updateNeedle(s, e);
    if (tool === 'eraser' && e.pointerType !== 'touch') {
      renderer.overlay.eraser = { pos: s, r: this.eraserRadius(), visible: true };
      renderer.invalidateOverlay();
    }

    const d = vp.toDoc(s);
    switch (this.mode) {
      case 'draw': {
        const last = this.raw[this.raw.length - 1];
        if (dist(last, d) * vp.scale >= 0.8) {
          this.raw.push(d);
          this.moved = true;
          this.schedulePreview();
        }
        break;
      }
      case 'erase':
        this.editor.eraseAt(d, this.eraserRadius());
        break;
      case 'pan':
        vp.panBy(s.x - this.panLast.x, s.y - this.panLast.y);
        this.panLast = s;
        break;
      case 'zoom': {
        if (!this.zoomStart) break;
        const dy = s.y - this.zoomStart.screen.y;
        if (Math.abs(dy) > 3) this.moved = true;
        if (this.moved) vp.setZoom(this.zoomStart.scale * Math.exp(-dy * 0.006), this.zoomStart.screen);
        break;
      }
    }
  }

  private onUp(e: PointerEvent): void {
    const s = this.local(e);
    this.pointers.delete(e.pointerId);
    if (this.mode === 'pinch') {
      if (this.pointers.size < 2) {
        this.mode = 'idle';
        this.pinchPrev = null;
        this.pointers.clear();
      }
      this.updateCursorClass();
      return;
    }
    const renderer = this.editor.renderer;
    switch (this.mode) {
      case 'draw':
        if (this.previewRaf) {
          cancelAnimationFrame(this.previewRaf);
          this.previewRaf = 0;
        }
        if (renderer) {
          renderer.overlay.preview = null;
          renderer.overlay.needle.puncture = 0.9;
        }
        this.editor.commitStroke(this.raw);
        this.raw = [];
        break;
      case 'erase':
        this.editor.endErase();
        break;
      case 'zoom':
        if (!this.moved) this.editor.viewport.zoomAt(s, e.altKey || e.shiftKey ? 1 / 1.5 : 1.5);
        this.zoomStart = null;
        break;
    }
    this.mode = 'idle';
    this.updateCursorClass();
    renderer?.invalidateOverlay();
  }

  private onLeave(): void {
    const renderer = this.editor.renderer;
    if (renderer && this.mode === 'idle') {
      renderer.overlay.needle.visible = false;
      renderer.overlay.eraser.visible = false;
      renderer.invalidateOverlay();
    }
  }

  private cancelGesture(): void {
    const renderer = this.editor.renderer;
    if (this.mode === 'draw') {
      this.raw = [];
      if (renderer) renderer.overlay.preview = null;
      if (this.previewRaf) {
        cancelAnimationFrame(this.previewRaf);
        this.previewRaf = 0;
      }
    } else if (this.mode === 'erase') {
      this.editor.endErase();
    }
    this.zoomStart = null;
    renderer?.invalidateOverlay();
  }

  private updateNeedle(s: Point, e: PointerEvent): void {
    const renderer = this.editor.renderer;
    if (!renderer) return;
    const needle = renderer.overlay.needle;
    const now = performance.now();
    if (this.lastMove) {
      const dx = s.x - this.lastMove.p.x;
      const dy = s.y - this.lastMove.p.y;
      const d = Math.hypot(dx, dy);
      if (d > 1.2) needle.angle = lerpAngle(needle.angle, Math.atan2(dy, dx), Math.min(0.5, 0.18 + d * 0.02));
    }
    this.lastMove = { p: s, t: now };
    needle.pos = s;
    needle.visible = e.pointerType !== 'touch';
    renderer.invalidateOverlay();
  }

  private schedulePreview(): void {
    if (this.previewRaf) return;
    this.previewRaf = requestAnimationFrame(() => {
      this.previewRaf = 0;
      const renderer = this.editor.renderer;
      if (!renderer || this.mode !== 'draw') return;
      const prims = this.editor.previewStroke(this.raw);
      const threads = prims.reduce((n, p) => n + (p.kind === 'thread' ? 1 : 0), 0);
      if (threads > this.lastPrimCount) {
        renderer.overlay.needle.puncture = Math.max(renderer.overlay.needle.puncture, 0.6);
        this.lastPrimCount = threads;
      }
      renderer.overlay.preview = prims;
      renderer.overlay.previewColor = this.editor.store.get().color;
      renderer.overlay.looseTail = 2;
      renderer.invalidateOverlay();
    });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const vp = this.editor.viewport;
    const s = this.local(e);
    if (e.ctrlKey || e.metaKey) {
      vp.zoomAt(s, Math.exp(-e.deltaY * 0.01));
      return;
    }
    const wheelStep =
      e.deltaMode === 1 || (e.deltaX === 0 && Math.abs(e.deltaY) >= 50 && Number.isInteger(e.deltaY));
    if (wheelStep) vp.zoomAt(s, Math.exp(-Math.sign(e.deltaY) * 0.18));
    else vp.panBy(-e.deltaX, -e.deltaY);
  }
}
