import { Polyline } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, jitterSegment, thread, type StitchGenerator } from './primitives';

export class RunningStitch implements StitchGenerator {
  readonly type = 'running' as const;
  readonly sampleStep = 1.5;

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const len = Math.max(2, settings.length);
    const gap = Math.max(1.2, len * 0.7);
    const line = new Polyline(points);
    const out: Primitive[] = [];
    if (line.total < 1.5) {
      const a = points[0];
      const b = { x: a.x + len, y: a.y };
      out.push(hole(a, w * 0.55), hole(b, w * 0.55), thread([a, b], w));
      return out;
    }
    let d = 0;
    let i = 0;
    while (d < line.total - 0.5) {
      const end = Math.min(d + len, line.total);
      if (end - d < len * 0.35 && i > 0) break;
      const [a, b] = jitterSegment(line.at(d).p, line.at(end).p, i + 1, w * 0.3);
      out.push(hole(a, w * 0.55), hole(b, w * 0.55), thread([a, b], w));
      d = end + gap;
      i++;
    }
    return out;
  }
}
