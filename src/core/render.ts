import { add, centroid, cross, dot, hash, LIGHT_DIR, mul, normalize, perp, sub } from './geom';
import type { HolePrimitive, Point, Primitive, Stitch } from './types';

interface ThreadPalette {
  base: string;
  dark: string;
  darkSoft: string;
  light: [string, string, string];
  shadow: string;
}

type RGB = [number, number, number];

const paletteCache = new Map<string, ThreadPalette>();

function parseColor(c: string): RGB {
  const s = c.trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    return h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = s.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : [128, 128, 128];
}

function mixRgb(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

const rgba = (c: RGB, a: number) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

function threadPalette(color: string): ThreadPalette {
  const cached = paletteCache.get(color);
  if (cached) return cached;
  const rgb = parseColor(color);
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  const dark = mixRgb(rgb, [38, 24, 14], lum > 0.82 ? 0.3 : 0.42);
  const light = mixRgb(rgb, [255, 252, 244], lum > 0.82 ? 0.95 : 0.62);
  const palette: ThreadPalette = {
    base: rgba(rgb, 1),
    dark: rgba(dark, lum > 0.82 ? 0.38 : 0.48),
    darkSoft: rgba(dark, 0.2),
    light: [rgba(light, 0.3), rgba(light, 0.52), rgba(light, 0.8)],
    shadow: 'rgba(58, 40, 22, 0.32)',
  };
  paletteCache.set(color, palette);
  return palette;
}

function tracePath(ctx: CanvasRenderingContext2D, pts: Point[], closed?: boolean): void {
  if (pts.length === 0) return;
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  if (closed) ctx.closePath();
}

function offsetPoints(pts: Point[], d: Point): Point[] {
  return pts.map((p) => ({ x: p.x + d.x, y: p.y + d.y }));
}

interface Strip {
  pts: Point[];
  /** 0..1, how perpendicular the strip runs to the light (drives highlight strength) */
  dir: number;
}

/** Splits a thread outline into lit and shaded side strips. */
function shadingStrips(pts: Point[], closed: boolean, offset: number): { light: Strip[]; shade: Strip[] } {
  const n = pts.length;
  const light: Strip[] = [];
  const shade: Strip[] = [];
  if (n < 2) return { light, shade };
  let curLight: Point[] = [];
  let curShade: Point[] = [];
  let dirSum = 0;
  let side = 0;
  const flush = () => {
    if (curLight.length >= 2) {
      const dir = dirSum / curLight.length;
      light.push({ pts: curLight, dir });
      shade.push({ pts: curShade, dir });
    }
    curLight = [];
    curShade = [];
    dirSum = 0;
  };
  for (let i = 0; i < n; i++) {
    const prev = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
    const next = closed ? pts[(i + 1) % n] : pts[Math.min(i + 1, n - 1)];
    const t = normalize(sub(next, prev));
    const nrm = perp(t);
    const s = dot(nrm, LIGHT_DIR) >= 0 ? 1 : -1;
    if (side !== 0 && s !== side) flush();
    side = s;
    const o = mul(nrm, s * offset);
    curLight.push(add(pts[i], o));
    curShade.push(sub(pts[i], o));
    dirSum += Math.abs(cross(t, LIGHT_DIR));
  }
  flush();
  if (closed && light.length === 1) {
    light[0].pts.push(light[0].pts[0]);
    shade[0].pts.push(shade[0].pts[0]);
  }
  return { light, shade };
}

/** Bows a thread sideways (or inflates a loop) to animate a stitch being pulled tight. */
function loosen(pts: Point[], w: number, amount: number, seed: number, closed: boolean): Point[] {
  if (amount <= 0.001) return pts;
  if (closed) {
    const c = centroid(pts);
    const k = 1 + 0.16 * amount;
    return pts.map((p) => ({ x: c.x + (p.x - c.x) * k, y: c.y + (p.y - c.y) * k }));
  }
  let src = pts;
  if (pts.length === 2) {
    src = [pts[0], { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 }, pts[1]];
  }
  const n = src.length;
  const sign = hash(seed, 17) < 0.5 ? -1 : 1;
  const out = [src[0]];
  for (let i = 1; i < n - 1; i++) {
    const t = i / (n - 1);
    const dir = normalize(sub(src[i + 1], src[i - 1]));
    const nrm = perp(dir);
    const bow = sign * amount * w * 1.1 * Math.sin(Math.PI * t);
    out.push(add(src[i], mul(nrm, bow)));
  }
  out.push(src[n - 1]);
  return out;
}

function drawHoles(ctx: CanvasRenderingContext2D, holes: HolePrimitive[], full: boolean): void {
  if (holes.length === 0) return;
  ctx.fillStyle = 'rgba(72, 50, 30, 0.30)';
  ctx.beginPath();
  for (const h of holes) {
    ctx.moveTo(h.p.x - 0.15 * h.r + h.r, h.p.y - 0.15 * h.r);
    ctx.arc(h.p.x - 0.15 * h.r, h.p.y - 0.15 * h.r, h.r, 0, Math.PI * 2);
  }
  ctx.fill();
  if (!full) return;
  ctx.fillStyle = 'rgba(46, 30, 18, 0.34)';
  ctx.beginPath();
  for (const h of holes) {
    const r = h.r * 0.55;
    ctx.moveTo(h.p.x - 0.2 * h.r + r, h.p.y - 0.2 * h.r);
    ctx.arc(h.p.x - 0.2 * h.r, h.p.y - 0.2 * h.r, r, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 250, 240, 0.30)';
  ctx.beginPath();
  for (const h of holes) {
    const r = h.r * 0.5;
    ctx.moveTo(h.p.x + 0.38 * h.r + r, h.p.y + 0.38 * h.r);
    ctx.arc(h.p.x + 0.38 * h.r, h.p.y + 0.38 * h.r, r, 0, Math.PI * 2);
  }
  ctx.fill();
}

interface ThreadItem {
  pts: Point[];
  closed: boolean;
  raised: boolean;
}

interface ThreadGroup {
  key: string;
  color: string;
  w: number;
  items: ThreadItem[];
}

function drawThreadGroup(ctx: CanvasRenderingContext2D, group: ThreadGroup, full: boolean): void {
  const pal = threadPalette(group.color);
  const w = group.w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // drop shadow
  ctx.strokeStyle = pal.shadow;
  ctx.lineWidth = w * 1.18;
  ctx.beginPath();
  for (const it of group.items) tracePath(ctx, offsetPoints(it.pts, { x: w * 0.3, y: w * 0.4 }), it.closed);
  ctx.stroke();
  const raised = group.items.filter((it) => it.raised);
  if (raised.length) {
    ctx.lineWidth = w * 1.6;
    ctx.beginPath();
    for (const it of raised) tracePath(ctx, offsetPoints(it.pts, { x: w * 0.45, y: w * 0.6 }), it.closed);
    ctx.stroke();
  }

  // body
  ctx.strokeStyle = pal.base;
  ctx.lineWidth = w;
  ctx.beginPath();
  for (const it of group.items) tracePath(ctx, it.pts, it.closed);
  ctx.stroke();
  if (!full) return;

  // twist
  ctx.strokeStyle = pal.darkSoft;
  ctx.lineWidth = w * 0.94;
  ctx.setLineDash([w * 0.7, w * 1.05]);
  ctx.beginPath();
  for (const it of group.items) tracePath(ctx, it.pts, it.closed);
  ctx.stroke();
  ctx.setLineDash([]);

  // side shading
  const shades: Strip[] = [];
  const lights: [Strip[], Strip[], Strip[]] = [[], [], []];
  for (const it of group.items) {
    const { light, shade } = shadingStrips(it.pts, it.closed, w * 0.24);
    shades.push(...shade);
    for (const strip of light) lights[strip.dir < 0.4 ? 0 : strip.dir < 0.75 ? 1 : 2].push(strip);
  }
  ctx.strokeStyle = pal.dark;
  ctx.lineWidth = w * 0.3;
  ctx.beginPath();
  for (const s of shades) tracePath(ctx, s.pts, false);
  ctx.stroke();
  ctx.lineWidth = w * 0.32;
  for (let i = 0; i < 3; i++) {
    if (lights[i].length === 0) continue;
    ctx.strokeStyle = pal.light[i];
    ctx.beginPath();
    for (const s of lights[i]) tracePath(ctx, s.pts, false);
    ctx.stroke();
  }

  // dark caps where the thread enters the cloth
  ctx.fillStyle = 'rgba(50, 34, 20, 0.22)';
  ctx.beginPath();
  const cap = w * 0.5;
  for (const it of group.items) {
    if (it.closed || it.pts.length < 2) continue;
    const a = it.pts[0];
    const b = it.pts[it.pts.length - 1];
    ctx.moveTo(a.x + cap, a.y);
    ctx.arc(a.x, a.y, cap, 0, Math.PI * 2);
    ctx.moveTo(b.x + cap, b.y);
    ctx.arc(b.x, b.y, cap, 0, Math.PI * 2);
  }
  ctx.fill();
}

export interface DrawOptions {
  quality: 'fast' | 'full';
  /** 0..1 how loose (un-pulled) the threads are drawn */
  loose?: number;
  /** number of trailing threads that should look progressively looser (live preview) */
  looseTail?: number;
}

type ColoredPrimitive = HolePrimitive | (import('./types').ThreadPrimitive & { color?: string });

function drawPrimitives(ctx: CanvasRenderingContext2D, prims: ColoredPrimitive[], opts: DrawOptions): void {
  const full = opts.quality === 'full';
  const holes: HolePrimitive[] = [];
  const threads: Exclude<ColoredPrimitive, HolePrimitive>[] = [];
  for (const p of prims) {
    if (p.kind === 'hole') holes.push(p);
    else threads.push(p);
  }
  drawHoles(ctx, holes, full);

  const tail = opts.looseTail ?? 0;
  const tailStart = threads.length - tail;
  let group: ThreadGroup | null = null;
  let seed = 0;
  for (let i = 0; i < threads.length; i++) {
    const t = threads[i];
    const color = t.color ?? '#000';
    const key = `${t.w.toFixed(2)}|${color}`;
    if (!group || group.key !== key) {
      if (group) drawThreadGroup(ctx, group, full);
      group = { key, color, w: t.w, items: [] };
    }
    let loose = opts.loose ?? 0;
    if (tail > 0 && i >= tailStart) loose = Math.max(loose, 0.35 + (0.45 * (i - tailStart + 1)) / tail);
    const pts = loose > 0 ? loosen(t.pts, t.w, loose, seed++, !!t.closed) : t.pts;
    group.items.push({ pts, closed: !!t.closed, raised: !!t.raised });
  }
  if (group) drawThreadGroup(ctx, group, full);
}

/** Draws finished stitches (document space must already be set on the context). */
export function drawStitches(ctx: CanvasRenderingContext2D, stitches: Stitch[], opts: DrawOptions): void {
  const prims: ColoredPrimitive[] = [];
  for (const s of stitches) {
    for (const p of s.geometry) {
      if (p.kind === 'thread') prims.push({ ...p, color: s.color });
      else prims.push(p);
    }
  }
  drawPrimitives(ctx, prims, opts);
}

/** Draws an in-progress stroke in a single colour. */
export function drawPreview(ctx: CanvasRenderingContext2D, prims: Primitive[], color: string, opts: DrawOptions): void {
  drawPrimitives(
    ctx,
    prims.map((p) => (p.kind === 'thread' ? { ...p, color } : p)),
    opts,
  );
}
