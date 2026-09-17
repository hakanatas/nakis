import type { Point, Rect } from './types';

/** Direction the (virtual) light comes from, used for thread shading. */
export const LIGHT_DIR: Point = { x: -0.7071, y: -0.7071 };

export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Point, s: number): Point => ({ x: a.x * s, y: a.y * s });
export const lerp = (a: Point, b: Point, t: number): Point => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
export const dot = (a: Point, b: Point): number => a.x * b.x + a.y * b.y;
export const cross = (a: Point, b: Point): number => a.x * b.y - a.y * b.x;
export const dist = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);
export const perp = (a: Point): Point => ({ x: -a.y, y: a.x });
export const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function normalize(v: Point): Point {
  const l = Math.hypot(v.x, v.y);
  return l < 1e-9 ? { x: 1, y: 0 } : { x: v.x / l, y: v.y / l };
}

export function rotate(v: Point, angle: number): Point {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/** Deterministic 2D hash in [0, 1). */
export function hash(a: number, b: number): number {
  let n = Math.imul((a * 374761393) | 0, 668265263) ^ Math.imul((b * 1274126177) | 0, 1103515245);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export function boundsOf(pts: Point[], pad = 0): Rect {
  if (pts.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
}

/** Drops consecutive points closer than `minDist`. */
export function dedupe(pts: Point[], minDist = 0.4): Point[] {
  if (pts.length === 0) return [];
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (dist(out[out.length - 1], pts[i]) >= minDist) out.push(pts[i]);
  }
  return out;
}

export function chaikinOnce(pts: Point[]): Point[] {
  if (pts.length < 3) return pts.slice();
  const out = [pts[0]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    out.push(lerp(a, b, 0.25), lerp(a, b, 0.75));
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function chaikin(pts: Point[], iterations = 2): Point[] {
  let out = pts;
  for (let i = 0; i < iterations; i++) out = chaikinOnce(out);
  return out;
}

/** Smooths a freehand stroke while keeping sharp corners (angle above `cornerDeg`). */
export function smoothStroke(pts: Point[], cornerDeg = 55, iterations = 2): Point[] {
  const r = dedupe(pts, 0.6);
  if (r.length < 3) return r;
  const cosLimit = Math.cos((cornerDeg * Math.PI) / 180);
  const corners = [0];
  for (let i = 1; i < r.length - 1; i++) {
    const din = normalize(sub(r[i], r[i - 1]));
    const dout = normalize(sub(r[i + 1], r[i]));
    if (dist(r[i], r[i - 1]) > 2.5 && dist(r[i + 1], r[i]) > 2.5 && dot(din, dout) < cosLimit) {
      corners.push(i);
    }
  }
  corners.push(r.length - 1);
  const out: Point[] = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const segment = r.slice(corners[i], corners[i + 1] + 1);
    const smooth = chaikin(segment, iterations);
    if (i > 0) smooth.shift();
    out.push(...smooth);
  }
  return out;
}

/** Resamples a polyline at a fixed arc-length step. */
export function resample(pts: Point[], step: number): Point[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return [pts[0]];
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const len = dist(a, b);
    if (len < 1e-9) continue;
    let d = step - carry;
    while (d <= len) {
      out.push(lerp(a, b, d / len));
      d += step;
    }
    carry = len - (d - step);
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > step * 0.25) out.push(last);
  return out;
}

/** Arc-length parametrised polyline. */
export class Polyline {
  readonly cum: number[] = [0];
  readonly total: number;

  constructor(readonly pts: Point[]) {
    for (let i = 1; i < pts.length; i++) {
      this.cum.push(this.cum[i - 1] + dist(pts[i - 1], pts[i]));
    }
    this.total = this.cum[this.cum.length - 1];
  }

  at(d: number): { p: Point; t: Point } {
    const pts = this.pts;
    if (pts.length === 1) return { p: pts[0], t: { x: 1, y: 0 } };
    const target = clamp(d, 0, this.total);
    let lo = 0;
    let hi = this.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] <= target) lo = mid;
      else hi = mid;
    }
    const a = pts[lo];
    const b = pts[Math.min(lo + 1, pts.length - 1)];
    const segLen = this.cum[hi] - this.cum[lo];
    const t = segLen > 1e-9 ? (target - this.cum[lo]) / segLen : 0;
    return { p: lerp(a, b, t), t: normalize(sub(b, a)) };
  }
}

export function distToSegment(p: Point, a: Point, b: Point): number {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  if (len2 < 1e-12) return dist(p, a);
  const t = clamp(dot(sub(p, a), ab) / len2, 0, 1);
  return dist(p, add(a, mul(ab, t)));
}

export function distToPolyline(p: Point, pts: Point[], closed = false): number {
  if (pts.length === 1) return dist(p, pts[0]);
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const d = distToSegment(p, pts[i - 1], pts[i]);
    if (d < best) best = d;
  }
  if (closed && pts.length > 2) {
    const d = distToSegment(p, pts[pts.length - 1], pts[0]);
    if (d < best) best = d;
  }
  return best;
}

export function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  return Math.abs(area) / 2;
}

export function centroid(pts: Point[]): Point {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

/** Principal axis angle of a point cloud (used as the default satin hatch angle). */
export function principalAngle(pts: Point[]): number {
  const c = centroid(pts);
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of pts) {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

/** Scanline hatch of a polygon: parallel segments at `angle`, `spacing` apart. */
export function hatchLines(poly: Point[], angle: number, spacing: number): [Point, Point][] {
  if (poly.length < 3) return [];
  const c = centroid(poly);
  const local = poly.map((p) => rotate(sub(p, c), -angle));
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of local) {
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const lines: [Point, Point][] = [];
  const n = local.length;
  for (let y = minY + spacing * 0.5; y < maxY; y += spacing) {
    const xs: number[] = [];
    for (let i = 0; i < n; i++) {
      const a = local[i];
      const b = local[(i + 1) % n];
      if (a.y !== b.y && ((y >= a.y && y < b.y) || (y >= b.y && y < a.y))) {
        xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y));
      }
    }
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      if (xs[i + 1] - xs[i] < 0.8) continue;
      const p0 = add(rotate({ x: xs[i], y }, angle), c);
      const p1 = add(rotate({ x: xs[i + 1], y }, angle), c);
      lines.push([p0, p1]);
    }
  }
  return lines;
}

/** Closed petal / loop outline from `a` to `b` with the given half-width. */
export function petal(a: Point, b: Point, width: number, segments = 14, power = 0.9): Point[] {
  const axis = sub(b, a);
  const n = normalize(perp(axis));
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = width * Math.pow(Math.sin(Math.PI * Math.pow(t, power)), 0.85);
    const p = add(a, mul(axis, t));
    left.push(add(p, mul(n, w)));
    right.push(sub(p, mul(n, w)));
  }
  right.reverse();
  right.shift();
  right.pop();
  return [...left, ...right];
}

export function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
