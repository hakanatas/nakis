import { dist, hash, Polyline } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, thread, type StitchGenerator } from './primitives';

export class FrenchKnot implements StitchGenerator {
  readonly type = 'french-knot' as const;
  readonly sampleStep = 2;

  static knot(center: Point, thickness: number, seed: number): Primitive[] {
    const radius = thickness * 1.25 + 1.4;
    const start = hash(seed, 3) * Math.PI * 2;
    const turns = 2.4;
    const segments = 72;
    const pts: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const a = start + t * turns * Math.PI * 2;
      const r = radius * (0.16 + 0.84 * t);
      pts.push({ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r });
    }
    const end = pts[pts.length - 1];
    return [hole(center, thickness * 0.5), hole(end, thickness * 0.4), thread(pts, thickness * 0.85, false, true)];
  }

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const radius = w * 1.25 + 1.4;
    const spacing = Math.max(settings.length, radius * 2.3);
    const line = new Polyline(points);
    const centers: Point[] = [];
    if (line.total < 2) {
      centers.push(points[0]);
    } else {
      for (let d = 0; d <= line.total; d += spacing) centers.push(line.at(d).p);
      const last = points[points.length - 1];
      if (dist(centers[centers.length - 1], last) > spacing * 0.6) centers.push(last);
    }
    const out: Primitive[] = [];
    centers.forEach((c, i) => out.push(...FrenchKnot.knot(c, w, i + 1)));
    return out;
  }
}
