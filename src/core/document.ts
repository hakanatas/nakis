import { DOC_HEIGHT, DOC_WIDTH, GRID_SIZE } from './constants';
import { distToPolyline, rectsIntersect } from './geom';
import { SpatialIndex } from './spatial';
import { rebuildStitch } from './stitches';
import type { Point, ProjectData, Rect, Stitch } from './types';

/** The embroidery project: an ordered set of stitches plus a spatial index. */
export class EmbroideryDocument {
  width = DOC_WIDTH;
  height = DOC_HEIGHT;
  gridSize = GRID_SIZE;
  name = 'Untitled embroidery';
  revision = 0;

  private stitches = new Map<string, Stitch>();
  private order: string[] = [];
  private index = new SpatialIndex<Stitch>(48);
  private listeners = new Set<() => void>();

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private changed(): void {
    this.revision++;
    for (const fn of this.listeners) fn();
  }

  get count(): number {
    return this.order.length;
  }

  all(): Stitch[] {
    const out: Stitch[] = [];
    for (const id of this.order) {
      const s = this.stitches.get(id);
      if (s) out.push(s);
    }
    return out;
  }

  get(id: string): Stitch | undefined {
    return this.stitches.get(id);
  }

  indexOf(id: string): number {
    return this.order.indexOf(id);
  }

  add(stitch: Stitch, at?: number): void {
    if (this.stitches.has(stitch.id)) return;
    this.stitches.set(stitch.id, stitch);
    if (at === undefined || at < 0 || at >= this.order.length) this.order.push(stitch.id);
    else this.order.splice(at, 0, stitch.id);
    this.index.insert(stitch);
    this.changed();
  }

  addMany(stitches: Stitch[]): void {
    for (const s of stitches) {
      if (this.stitches.has(s.id)) continue;
      this.stitches.set(s.id, s);
      this.order.push(s.id);
      this.index.insert(s);
    }
    this.changed();
  }

  remove(id: string): Stitch | undefined {
    const s = this.stitches.get(id);
    if (!s) return;
    this.stitches.delete(id);
    const i = this.order.indexOf(id);
    if (i >= 0) this.order.splice(i, 1);
    this.index.remove(s);
    this.changed();
    return s;
  }

  removeMany(ids: string[]): void {
    let any = false;
    for (const id of ids) {
      const s = this.stitches.get(id);
      if (s) {
        this.stitches.delete(id);
        this.index.remove(s);
        any = true;
      }
    }
    if (any) {
      const gone = new Set(ids);
      this.order = this.order.filter((id) => !gone.has(id));
      this.changed();
    }
  }

  clear(): void {
    this.stitches.clear();
    this.order = [];
    this.index.clear();
    this.changed();
  }

  /** Stitches whose bounds intersect `rect`, in drawing order. */
  queryRect(rect: Rect): Stitch[] {
    const hits = this.index.query(rect).filter((s) => rectsIntersect(s.bounds, rect));
    const pos = new Map(this.order.map((id, i) => [id, i] as const));
    hits.sort((a, b) => (pos.get(a.id) ?? 0) - (pos.get(b.id) ?? 0));
    return hits;
  }

  hitTestAll(p: Point, radius: number): Stitch[] {
    const rect = { x: p.x - radius, y: p.y - radius, w: radius * 2, h: radius * 2 };
    const out: Stitch[] = [];
    for (const s of this.queryRect(rect)) {
      if (this.stitchHit(s, p, radius)) out.push(s);
    }
    return out;
  }

  /** Topmost stitch under the point. */
  hitTest(p: Point, radius: number): Stitch | undefined {
    const hits = this.hitTestAll(p, radius);
    return hits[hits.length - 1];
  }

  private stitchHit(s: Stitch, p: Point, radius: number): boolean {
    for (const prim of s.geometry) {
      if (prim.kind === 'thread' && distToPolyline(p, prim.pts, prim.closed) <= prim.w * 0.5 + radius) return true;
    }
    return false;
  }

  /** Rectangle around the content (or the whole cloth when empty), never smaller than `min`. */
  frame(pad = 40, min = 360): Rect {
    const b = this.contentBounds();
    if (!b) return { x: 0, y: 0, w: this.width, h: this.height };
    let w = b.w + pad * 2;
    let h = b.h + pad * 2;
    let x = b.x - pad;
    let y = b.y - pad;
    if (w < min) {
      x -= (min - w) / 2;
      w = min;
    }
    if (h < min) {
      y -= (min - h) / 2;
      h = min;
    }
    return { x, y, w, h };
  }

  contentBounds(): Rect | null {
    let r: Rect | null = null;
    for (const s of this.stitches.values()) {
      if (!r) {
        r = { ...s.bounds };
      } else {
        const x0 = Math.min(r.x, s.bounds.x);
        const y0 = Math.min(r.y, s.bounds.y);
        const x1 = Math.max(r.x + r.w, s.bounds.x + s.bounds.w);
        const y1 = Math.max(r.y + r.h, s.bounds.y + s.bounds.h);
        r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
    }
    return r;
  }

  toJSON(): ProjectData {
    const stitches = this.all().map((s) => ({
      id: s.id,
      type: s.type,
      points: s.points.map((p) => ({ x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100 })),
      color: s.color,
      thickness: s.thickness,
      length: s.length,
      ...(s.params ? { params: s.params } : {}),
    }));
    return {
      version: 1,
      name: this.name,
      width: this.width,
      height: this.height,
      gridSize: this.gridSize,
      stitches,
      savedAt: Date.now(),
    };
  }

  load(data: ProjectData): void {
    this.width = data.width || DOC_WIDTH;
    this.height = data.height || DOC_HEIGHT;
    this.gridSize = data.gridSize || GRID_SIZE;
    this.name = data.name || this.name;
    this.stitches.clear();
    this.order = [];
    this.index.clear();
    for (const item of data.stitches) {
      try {
        const s = rebuildStitch(item);
        this.stitches.set(s.id, s);
        this.order.push(s.id);
        this.index.insert(s);
      } catch {
        // skip malformed stitches
      }
    }
    this.changed();
  }
}
