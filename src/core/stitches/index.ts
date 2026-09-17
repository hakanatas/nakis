import { newId } from '../constants';
import { boundsOf, resample, smoothStroke } from '../geom';
import type { Point, Primitive, Rect, Stitch, StitchData, StitchParams, StitchSettings, StitchType } from '../types';
import { BackStitch } from './back';
import { ChainStitch } from './chain';
import { CrossStitch } from './cross';
import { FrenchKnot } from './frenchKnot';
import { LazyDaisy } from './lazyDaisy';
import type { StitchGenerator } from './primitives';
import { RunningStitch } from './running';
import { SatinStitch } from './satin';

export { CrossStitch, SatinStitch, FrenchKnot };
export type { StitchGenerator };

export const GENERATORS: Record<StitchType, StitchGenerator> = {
  running: new RunningStitch(),
  back: new BackStitch(),
  cross: new CrossStitch(),
  chain: new ChainStitch(),
  satin: new SatinStitch(),
  'french-knot': new FrenchKnot(),
  'lazy-daisy': new LazyDaisy(),
};

/** Smooths and resamples a raw pointer stroke for the given stitch type. */
export function prepareStroke(points: Point[], type: StitchType): Point[] {
  if (points.length <= 1) return points.slice();
  const gen = GENERATORS[type];
  return resample(smoothStroke(points, 55, 2), gen.sampleStep);
}

export function geometryBounds(geometry: Primitive[]): Rect {
  const pts: Point[] = [];
  let pad = 0;
  for (const prim of geometry) {
    if (prim.kind === 'thread') {
      pts.push(...prim.pts);
      pad = Math.max(pad, prim.w);
    } else {
      pts.push(prim.p);
      pad = Math.max(pad, prim.r);
    }
  }
  return boundsOf(pts, pad + 1);
}

export function buildStitch(
  type: StitchType,
  points: Point[],
  settings: StitchSettings,
  params?: StitchParams,
  id: string = newId(),
): Stitch {
  const pts = points.length ? points : [{ x: 0, y: 0 }];
  const geometry = GENERATORS[type].generate(pts, settings, params);
  return {
    id,
    type,
    points: pts,
    color: settings.color,
    thickness: settings.thickness,
    length: settings.length,
    params,
    bounds: geometryBounds(geometry),
    geometry,
  };
}

export function rebuildStitch(data: StitchData): Stitch {
  return buildStitch(
    data.type,
    data.points,
    { color: data.color, thickness: data.thickness, length: data.length },
    data.params,
    data.id,
  );
}
