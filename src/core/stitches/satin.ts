import {
  add,
  clamp,
  dedupe,
  dist,
  hash,
  hatchLines,
  mul,
  normalize,
  perp,
  polygonArea,
  Polyline,
  principalAngle,
  rotate,
  sub,
} from '../geom';
import type { Point, Primitive, StitchParams, StitchSettings } from '../types';
import { hole, jitterSegment, thread, type StitchGenerator } from './primitives';

export class SatinStitch implements StitchGenerator {
  readonly type = 'satin' as const;
  readonly sampleStep = 1.5;

  /** A stroke that ends near where it started (and encloses some area) becomes a filled region. */
  static isClosed(points: Point[], length: number): boolean {
    if (points.length < 8) return false;
    const a = points[0];
    const b = points[points.length - 1];
    return dist(a, b) < Math.max(14, length * 1.2) && polygonArea(points) > 50;
  }

  generate(points: Point[], settings: StitchSettings, params?: StitchParams): Primitive[] {
    const w = settings.thickness;
    const spacing = Math.max(0.9, w * 0.78);
    const out: Primitive[] = [];

    if (params?.region === 1 || SatinStitch.isClosed(points, settings.length)) {
      let poly = dedupe(points, 0.8);
      if (poly.length > 2 && dist(poly[0], poly[poly.length - 1]) < 1) poly = poly.slice(0, -1);
      if (poly.length < 3) return out;
      const angle = params?.angle ?? principalAngle(poly);
      hatchLines(poly, angle, spacing).forEach(([p0, p1], i) => {
        const [a, b] = jitterSegment(p0, p1, i + 3, w * 0.35);
        out.push(thread([a, b], w));
        if (i % 2 === 0) out.push(hole(a, w * 0.42), hole(b, w * 0.42));
      });
      return out;
    }

    const half = clamp(settings.length * 1.6, 5, 60) / 2;
    const slant = params?.slant ?? 0.2;
    const line = new Polyline(points);
    const total = line.total;
    let d = 0;
    let i = 0;
    do {
      const { p, t } = line.at(d);
      const n = rotate(perp(normalize(t)), slant);
      const j = (hash(i, 5) - 0.5) * w * 0.35;
      const a = add(sub(p, mul(n, half)), mul(n, j));
      const b = add(add(p, mul(n, half)), mul(n, j));
      out.push(thread([a, b], w));
      if (i % 2 === 0) out.push(hole(a, w * 0.42), hole(b, w * 0.42));
      d += spacing;
      i++;
    } while (d <= total);
    return out;
  }
}
