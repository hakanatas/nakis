import { add, mul, normalize, perp, Polyline, sub } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, thread, type StitchGenerator } from './primitives';

export class BackStitch implements StitchGenerator {
  readonly type = 'back' as const;
  readonly sampleStep = 1.5;

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const len = Math.max(2.5, settings.length);
    const line = new Polyline(points);
    const out: Primitive[] = [];
    if (line.total < 1.5) {
      const a = points[0];
      const b = { x: a.x + len, y: a.y };
      out.push(hole(a, w * 0.5), hole(b, w * 0.5), thread([a, b], w));
      return out;
    }
    let d = 0;
    let i = 0;
    out.push(hole(line.at(0).p, w * 0.5));
    while (d < line.total - 0.5) {
      const end = Math.min(d + len, line.total);
      if (end - d < len * 0.3 && i > 0) break;
      const b = line.at(end).p;
      const overlap = Math.min(len * 0.14, d);
      const a = line.at(d - overlap).p;
      const n = perp(normalize(sub(b, a)));
      const offset = (i % 2 === 0 ? 1 : -1) * w * 0.1;
      out.push(hole(b, w * 0.5));
      out.push(thread([add(a, mul(n, offset)), add(b, mul(n, offset))], w));
      d = end;
      i++;
    }
    return out;
  }
}
