import { add, hash, mul, normalize, perp, sub } from '../geom';
import type { HolePrimitive, Point, StitchParams, StitchSettings, StitchType, ThreadPrimitive } from '../types';

export const hole = (p: Point, r: number): HolePrimitive => ({ kind: 'hole', p, r });

export const thread = (pts: Point[], w: number, closed = false, raised = false): ThreadPrimitive => ({
  kind: 'thread',
  pts,
  w,
  closed,
  raised,
});

/** Nudges both ends of a segment by a deterministic, seed-based amount so rows do not look machine-made. */
export function jitterSegment(a: Point, b: Point, seed: number, amount: number): [Point, Point] {
  const dir = normalize(sub(b, a));
  const n = perp(dir);
  const oa = (hash(seed, 11) - 0.5) * amount;
  const ob = (hash(seed, 29) - 0.5) * amount;
  const ta = (hash(seed, 43) - 0.5) * amount;
  const tb = (hash(seed, 67) - 0.5) * amount;
  return [add(add(a, mul(n, oa)), mul(dir, -ta)), add(add(b, mul(n, ob)), mul(dir, tb))];
}

export interface StitchGenerator {
  readonly type: StitchType;
  /** Resampling step used when preparing a freehand stroke for this stitch. */
  readonly sampleStep: number;
  generate(points: Point[], settings: StitchSettings, params?: StitchParams): import('../types').Primitive[];
}
