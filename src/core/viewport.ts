import { clamp } from './geom';
import type { Point, Rect } from './types';

export interface ViewState {
  scale: number;
  tx: number;
  ty: number;
}

/** Pan / zoom transform between document space and screen (CSS px) space. */
export class Viewport {
  scale = 1;
  tx = 0;
  ty = 0;
  width = 0;
  height = 0;
  minScale = 0.2;
  maxScale = 10;
  /** When set, panning is clamped so this rect never leaves the screen entirely. */
  bounds: Rect | null = null;

  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  state(): ViewState {
    return { scale: this.scale, tx: this.tx, ty: this.ty };
  }

  setSize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    this.emit();
  }

  toScreen(p: Point): Point {
    return { x: p.x * this.scale + this.tx, y: p.y * this.scale + this.ty };
  }

  toDoc(p: Point): Point {
    return { x: (p.x - this.tx) / this.scale, y: (p.y - this.ty) / this.scale };
  }

  panBy(dx: number, dy: number): void {
    this.tx += dx;
    this.ty += dy;
    this.clampPan();
    this.emit();
  }

  private clampPan(): void {
    const b = this.bounds;
    if (!b || this.width <= 0) return;
    const mx = Math.min(160, this.width * 0.35);
    const my = Math.min(160, this.height * 0.35);
    const left = b.x * this.scale + this.tx;
    const right = (b.x + b.w) * this.scale + this.tx;
    const top = b.y * this.scale + this.ty;
    const bottom = (b.y + b.h) * this.scale + this.ty;
    if (right < mx) this.tx += mx - right;
    else if (left > this.width - mx) this.tx -= left - (this.width - mx);
    if (bottom < my) this.ty += my - bottom;
    else if (top > this.height - my) this.ty -= top - (this.height - my);
  }

  zoomAt(screen: Point, factor: number): void {
    const next = clamp(this.scale * factor, this.minScale, this.maxScale);
    if (next === this.scale) return;
    const anchor = this.toDoc(screen);
    this.scale = next;
    this.tx = screen.x - anchor.x * next;
    this.ty = screen.y - anchor.y * next;
    this.clampPan();
    this.emit();
  }

  setZoom(scale: number, screen?: Point): void {
    const at = screen ?? { x: this.width / 2, y: this.height / 2 };
    this.zoomAt(at, scale / this.scale);
  }

  fit(w: number, h: number, pad = 28): void {
    this.fitRect({ x: 0, y: 0, w, h }, pad);
  }

  fitRect(r: Rect, pad = 28): void {
    if (this.width <= 0 || this.height <= 0) return;
    const s = Math.min((this.width - pad * 2) / r.w, (this.height - pad * 2) / r.h);
    this.scale = clamp(s, this.minScale, this.maxScale);
    this.tx = this.width / 2 - (r.x + r.w / 2) * this.scale;
    this.ty = this.height / 2 - (r.y + r.h / 2) * this.scale;
    this.emit();
  }

  centerOn(p: Point): void {
    this.tx = this.width / 2 - p.x * this.scale;
    this.ty = this.height / 2 - p.y * this.scale;
    this.clampPan();
    this.emit();
  }

  visibleRect(): Rect {
    const a = this.toDoc({ x: 0, y: 0 });
    const b = this.toDoc({ x: this.width, y: this.height });
    return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
  }
}
