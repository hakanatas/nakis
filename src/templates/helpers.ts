import { DOC_HEIGHT, DOC_WIDTH, GRID_SIZE, newId } from '../core/constants';
import { add, chaikin, mul, normalize, perp, sub } from '../core/geom';
import { prepareStroke } from '../core/stitches';
import type { Point, ProjectData, StitchData, StitchParams, StitchType } from '../core/types';

export type StitchList = StitchData[];

export const pt = (x: number, y: number): Point => ({ x, y });

export function stitchData(
  type: StitchType,
  points: Point[],
  color: string,
  thickness: number,
  length: number,
  params?: StitchParams,
): StitchData {
  return { id: newId(), type, points, color, thickness, length, ...(params ? { params } : {}) };
}

/** Smooth a hand-placed polyline the same way a drawn stroke would be. */
export function smoothPath(points: Point[], type: StitchType): Point[] {
  return prepareStroke(chaikin(points, 3), type);
}

function linePoints(points: Point[], type: StitchType): Point[] {
  return points.length > 2 ? smoothPath(points, type) : prepareStroke(points, type);
}

/** Satin-filled region. */
export function fill(list: StitchList, poly: Point[], color: string, angle: number, thickness = 3.2): void {
  list.push(stitchData('satin', poly, color, thickness, 8, { region: 1, angle }));
}

export function backLine(list: StitchList, points: Point[], color: string, thickness = 3, length = 8): void {
  list.push(stitchData('back', linePoints(points, 'back'), color, thickness, length));
}

export function runningLine(list: StitchList, points: Point[], color: string, thickness = 2.4, length = 8): void {
  list.push(stitchData('running', linePoints(points, 'running'), color, thickness, length));
}

export function chainLine(list: StitchList, points: Point[], color: string, thickness = 3, length = 8): void {
  list.push(stitchData('chain', linePoints(points, 'chain'), color, thickness, length));
}

export function knot(list: StitchList, p: Point, color: string, thickness = 3.4): void {
  list.push(stitchData('french-knot', [p], color, thickness, 8));
}

export function daisyPetal(list: StitchList, from: Point, to: Point, color: string, thickness = 3): void {
  list.push(stitchData('lazy-daisy', [from, to], color, thickness, 8));
}

/** Ring of lazy-daisy petals around a french knot. */
export function flower(
  list: StitchList,
  center: Point,
  radius: number,
  petalColor: string,
  centerColor: string,
  petals = 6,
  rotation = 0,
  thickness = 3,
): void {
  for (let i = 0; i < petals; i++) {
    const a = rotation + (i / petals) * Math.PI * 2;
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    daisyPetal(list, add(center, mul(dir, radius * 0.18)), add(center, mul(dir, radius)), petalColor, thickness);
  }
  knot(list, center, centerColor, thickness + 0.6);
}

/** Block of cross stitches, serpentine order, aligned to the grid. */
export function crossBlock(
  list: StitchList,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  thickness = 2.6,
): void {
  const cell = GRID_SIZE;
  const pts: Point[] = [];
  const cols = Math.max(1, Math.round(w / cell));
  const rows = Math.max(1, Math.round(h / cell));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cc = r % 2 === 0 ? c : cols - 1 - c;
      pts.push({ x: x + cc * cell + cell / 2, y: y + r * cell + cell / 2 });
    }
  }
  list.push(stitchData('cross', pts, color, thickness, 10));
}

/** Closed rectangle outline, optionally with rounded corners. */
export function rect(x: number, y: number, w: number, h: number, radius = 0): Point[] {
  if (radius <= 0) return [pt(x, y), pt(x + w, y), pt(x + w, y + h), pt(x, y + h), pt(x, y)];
  const r = Math.min(radius, w / 2, h / 2);
  const out: Point[] = [];
  const corner = (cx: number, cy: number, start: number) => {
    for (let i = 0; i <= 4; i++) {
      const a = start + (i / 4) * (Math.PI / 2);
      out.push(pt(cx + Math.cos(a) * r, cy + Math.sin(a) * r));
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  out.push(out[0]);
  return out;
}

export function ellipse(center: Point, rx: number, ry: number, rotation = 0, segments = 20): Point[] {
  const out: Point[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push({
      x: center.x + x * Math.cos(rotation) - y * Math.sin(rotation),
      y: center.y + x * Math.sin(rotation) + y * Math.cos(rotation),
    });
  }
  return out;
}

/** Closed petal outline pointing away from `center` at `angle`, between radii r0 and r1. */
export function petalShape(center: Point, angle: number, r0: number, r1: number, width: number): Point[] {
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const n = { x: -dir.y, y: dir.x };
  const base = add(center, mul(dir, r0));
  const tip = add(center, mul(dir, r1));
  const axis = sub(tip, base);
  const left: Point[] = [];
  const right: Point[] = [];
  const segments = 14;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = width * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.75);
    const p = add(base, mul(axis, t));
    left.push(add(p, mul(n, w)));
    right.push(sub(p, mul(n, w)));
  }
  right.reverse();
  return [...left, ...right.slice(1, -1), left[0]];
}

/** Closed leaf outline from `a` to `b`. */
export function leafShape(a: Point, b: Point, width: number): Point[] {
  const axis = sub(b, a);
  const n = normalize(perp(axis));
  const left: Point[] = [];
  const right: Point[] = [];
  const segments = 16;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w = width * Math.pow(Math.sin(Math.PI * t), 0.9);
    const p = add(a, mul(axis, t));
    left.push(add(p, mul(n, w)));
    right.push(sub(p, mul(n, w)));
  }
  right.reverse();
  return [...left, ...right.slice(1, -1), left[0]];
}

/** Sun made of french knots with running-stitch rays. */
export function sun(list: StitchList, center: Point, radius: number, color: string, rayColor = color): void {
  const knotThickness = 3.6;
  const spacing = (knotThickness * 1.25 + 1.4) * 2.05;
  knot(list, center, color, knotThickness);
  for (let ring = 1; ring * spacing <= radius; ring++) {
    const r = ring * spacing;
    const count = Math.max(6, Math.round((Math.PI * 2 * r) / spacing));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.5;
      knot(list, add(center, mul({ x: Math.cos(a), y: Math.sin(a) }, r)), color, knotThickness);
    }
  }
  const rays = 10;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2 + 0.2;
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    runningLine(
      list,
      [add(center, mul(dir, radius + 9)), add(center, mul(dir, radius + 9 + (i % 2 ? 22 : 32)))],
      rayColor,
      2.4,
      7,
    );
  }
}

/** Satin-filled cloud with a chain-stitch outline along the bumps. */
export function cloud(list: StitchList, center: Point, width: number, color = '#f9f6ef'): void {
  const height = width * 0.42;
  const pts: Point[] = [];
  const bumps = 4;
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = Math.PI + t * Math.PI;
    const k = 1 + 0.18 * Math.abs(Math.sin(t * Math.PI * bumps));
    pts.push(pt(center.x + Math.cos(a) * width * 0.5 * k, center.y + Math.sin(a) * height * k));
  }
  pts.push(pt(center.x + width * 0.5, center.y + height * 0.1), pt(center.x - width * 0.5, center.y + height * 0.1), pts[0]);
  fill(list, pts, color, 0, 3);
  chainLine(list, pts.slice(0, 41), '#e2dccf', 2.6, 7);
}

/** Two back-stitch wing strokes. */
export function bird(list: StitchList, center: Point, size: number, color: string): void {
  backLine(
    list,
    [pt(center.x - size, center.y - size * 0.35), pt(center.x - size * 0.45, center.y + size * 0.15), pt(center.x, center.y - size * 0.1)],
    color,
    2.2,
    6,
  );
  backLine(
    list,
    [pt(center.x, center.y - size * 0.1), pt(center.x + size * 0.45, center.y + size * 0.15), pt(center.x + size, center.y - size * 0.35)],
    color,
    2.2,
    6,
  );
}

export function project(name: string, stitches: StitchList): ProjectData {
  return {
    version: 1,
    name,
    width: DOC_WIDTH,
    height: DOC_HEIGHT,
    gridSize: GRID_SIZE,
    stitches,
    savedAt: Date.now(),
  };
}
