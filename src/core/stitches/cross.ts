import { GRID_SIZE } from '../constants';
import { clamp, hash, resample } from '../geom';
import type { Point, Primitive, StitchSettings } from '../types';
import { hole, thread, type StitchGenerator } from './primitives';

export class CrossStitch implements StitchGenerator {
  readonly type = 'cross' as const;
  readonly sampleStep = 2;

  static cellSize(length: number): number {
    return Math.max(GRID_SIZE, Math.round(length / GRID_SIZE) * GRID_SIZE);
  }

  generate(points: Point[], settings: StitchSettings): Primitive[] {
    const w = settings.thickness;
    const cell = CrossStitch.cellSize(settings.length);
    const seen = new Set<string>();
    const cells: [number, number][] = [];
    for (const p of resample(points, cell / 3)) {
      const cx = Math.floor(p.x / cell);
      const cy = Math.floor(p.y / cell);
      const key = `${cx},${cy}`;
      if (!seen.has(key)) {
        seen.add(key);
        cells.push([cx, cy]);
      }
    }
    const inset = clamp(cell * 0.1, 0.6, 2.2);
    const out: Primitive[] = [];
    for (const [cx, cy] of cells) {
      const j = (hash(cx, cy) - 0.5) * w * 0.15;
      const x0 = cx * cell + inset + j;
      const y0 = cy * cell + inset - j;
      const x1 = (cx + 1) * cell - inset + j;
      const y1 = (cy + 1) * cell - inset - j;
      const tl = { x: x0, y: y0 };
      const tr = { x: x1, y: y0 };
      const bl = { x: x0, y: y1 };
      const br = { x: x1, y: y1 };
      out.push(hole(tl, w * 0.5), hole(tr, w * 0.5), hole(bl, w * 0.5), hole(br, w * 0.5));
      out.push(thread([bl, tr], w));
      out.push(thread([tl, br], w));
    }
    return out;
  }
}
