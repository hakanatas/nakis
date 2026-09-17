import { add, clamp, mul, petal, Polyline } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, thread, type StitchGenerator } from './primitives';

export class ChainStitch implements StitchGenerator {
  readonly type = 'chain' as const;
  readonly sampleStep = 1.5;

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const len = clamp(settings.length, 4, 40);
    const loopW = w * 1.1 + 1.2;
    const threadW = w * 0.85;
    const line = new Polyline(points);
    const out: Primitive[] = [];
    const total = line.total;
    if (total < 2) {
      const a = points[0];
      const b = { x: a.x + len, y: a.y };
      out.push(hole(a, w * 0.5), thread(petal(a, b, loopW, 12, 1.05), threadW, true));
      const tail = { x: b.x + w * 1.2, y: b.y };
      out.push(thread([b, tail], threadW), hole(tail, w * 0.45));
      return out;
    }
    let d = 0;
    let i = 0;
    let lastEnd = 0;
    while (d < total - 1) {
      const end = Math.min(d + len, total);
      if (end - d < len * 0.45 && i > 0) break;
      const a = line.at(d).p;
      const b = line.at(end).p;
      out.push(hole(a, w * 0.5));
      out.push(thread(petal(a, b, loopW, 12, 1.05), threadW, true));
      lastEnd = end;
      d = end - len * 0.2;
      i++;
    }
    const last = line.at(lastEnd);
    const tail = add(last.p, mul(last.t, w * 1.2));
    out.push(thread([last.p, tail], threadW), hole(tail, w * 0.45));
    return out;
  }
}
