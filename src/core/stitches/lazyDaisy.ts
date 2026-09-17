import { add, clamp, dist, mul, normalize, petal, sub } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, thread, type StitchGenerator } from './primitives';

export class LazyDaisy implements StitchGenerator {
  readonly type = 'lazy-daisy' as const;
  readonly sampleStep = 1.5;

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const a = points[0];
    let b = points[points.length - 1];
    let len = dist(a, b);
    if (len < 4) {
      len = clamp(settings.length * 3, 12, 40);
      b = { x: a.x, y: a.y - len };
    } else if (len > 90) {
      b = add(a, mul(normalize(sub(b, a)), 90));
      len = 90;
    }
    const width = clamp(len * 0.2, w * 0.9, 12);
    const dir = normalize(sub(b, a));
    const tieStart = sub(b, mul(dir, w * 0.6));
    const tieEnd = add(b, mul(dir, w * 1.3));
    return [
      hole(a, w * 0.5),
      thread(petal(a, b, width, 16, 1), w * 0.9, true),
      thread([tieStart, tieEnd], w * 0.85),
      hole(tieEnd, w * 0.45),
    ];
  }
}
