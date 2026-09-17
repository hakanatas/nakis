import { add, mul, normalize, sub } from '../core/geom';
import type { Point, ProjectData } from '../core/types';
import { ellipse, leafShape, petalShape, project, smoothPath, stitchData, type StitchList } from './helpers';

const PETAL = '#faf8f1';
const CENTER = '#e0a83a';
const STEM = '#5c8a45';
const VEIN = '#446b33';
const BUD = '#dd8a86';

function daisy(list: StitchList, center: Point, radius: number, rotation: number): void {
  for (let i = 0; i < 5; i++) {
    const a = rotation + (i / 5) * Math.PI * 2;
    const outline = petalShape(center, a, radius * 0.27, radius, radius * 0.3);
    list.push(stitchData('satin', outline, PETAL, 3.2, 8, { region: 1, angle: a }));
  }
  const knotThickness = 3.4;
  const spacing = (knotThickness * 1.25 + 1.4) * 2.05;
  list.push(stitchData('french-knot', [center], CENTER, knotThickness, 8));
  const coreRadius = radius * 0.24;
  for (let ring = 1; ring * spacing <= coreRadius + 0.01; ring++) {
    const r = ring * spacing;
    const count = Math.max(6, Math.round((Math.PI * 2 * r) / spacing));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + ring * 0.4;
      list.push(
        stitchData('french-knot', [{ x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a) * r }], CENTER, knotThickness, 8),
      );
    }
  }
}

function leaf(list: StitchList, a: Point, b: Point, width: number, angleOffset: number): void {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  list.push(stitchData('satin', leafShape(a, b, width), STEM, 3.4, 8, { region: 1, angle: angle + angleOffset }));
  list.push(stitchData('back', smoothPath([a, b], 'back'), VEIN, 2.4, 7));
}

function bud(list: StitchList, p: Point, from: Point): void {
  const angle = Math.atan2(p.y - from.y, p.x - from.x);
  list.push(stitchData('satin', ellipse(p, 8.6, 6.4, angle), BUD, 3, 8, { region: 1, angle }));
  const dir = { x: Math.cos(angle), y: Math.sin(angle) };
  const calyxCenter = sub(p, mul(dir, 6.5));
  const calyx = ellipse(calyxCenter, 3.6, 3.2, angle, 12);
  list.push(stitchData('satin', calyx, STEM, 2.6, 8, { region: 1, angle: angle + 0.5 }));
}

function branch(list: StitchList, path: Point[], buds: Point[]): void {
  list.push(stitchData('back', smoothPath(path, 'back'), STEM, 2.8, 8));
  const tip = path[path.length - 1];
  for (const b of buds) {
    const dir = normalize(sub(b, tip));
    const end = sub(b, mul(dir, 8));
    const mid = add(mul(add(tip, end), 0.5), mul({ x: -dir.y, y: dir.x }, 4));
    list.push(stitchData('back', smoothPath([tip, mid, end], 'back'), STEM, 2.3, 7));
    bud(list, b, tip);
  }
}

export function buildWildflowers(): ProjectData {
  const e: StitchList = [];
  e.push(
    stitchData(
      'back',
      smoothPath(
        [
          { x: 373, y: 660 },
          { x: 366, y: 560 },
          { x: 357, y: 470 },
          { x: 362, y: 380 },
          { x: 378, y: 300 },
          { x: 384, y: 262 },
        ],
        'back',
      ),
      STEM,
      4.6,
      9,
    ),
  );
  e.push(
    stitchData(
      'back',
      smoothPath(
        [
          { x: 360, y: 470 },
          { x: 305, y: 445 },
          { x: 250, y: 425 },
          { x: 222, y: 410 },
        ],
        'back',
      ),
      STEM,
      4.6,
      9,
    ),
  );
  e.push(
    stitchData(
      'back',
      smoothPath(
        [
          { x: 367, y: 592 },
          { x: 410, y: 578 },
          { x: 445, y: 560 },
        ],
        'back',
      ),
      STEM,
      4.6,
      9,
    ),
  );
  e.push(
    stitchData(
      'back',
      smoothPath(
        [
          { x: 358, y: 445 },
          { x: 395, y: 446 },
          { x: 428, y: 445 },
        ],
        'back',
      ),
      STEM,
      4.6 * 0.85,
      9,
    ),
  );
  e.push(
    stitchData(
      'back',
      smoothPath(
        [
          { x: 366, y: 572 },
          { x: 345, y: 570 },
          { x: 322, y: 566 },
        ],
        'back',
      ),
      STEM,
      4.6 * 0.85,
      9,
    ),
  );
  leaf(e, { x: 322, y: 566 }, { x: 171, y: 495 }, 23, 0.62);
  leaf(e, { x: 428, y: 445 }, { x: 540, y: 300 }, 22, -0.62);
  branch(
    e,
    [
      { x: 360, y: 400 },
      { x: 330, y: 360 },
      { x: 292, y: 305 },
    ],
    [
      { x: 167, y: 217 },
      { x: 225, y: 205 },
      { x: 254, y: 238 },
      { x: 188, y: 255 },
      { x: 208, y: 288 },
      { x: 266, y: 276 },
    ],
  );
  branch(
    e,
    [
      { x: 366, y: 520 },
      { x: 420, y: 490 },
      { x: 475, y: 456 },
    ],
    [
      { x: 530, y: 375 },
      { x: 567, y: 379 },
      { x: 497, y: 408 },
      { x: 551, y: 408 },
      { x: 567, y: 437 },
      { x: 522, y: 442 },
    ],
  );
  daisy(e, { x: 386, y: 209 }, 102, -Math.PI / 2 + 0.25);
  daisy(e, { x: 196, y: 383 }, 86, -Math.PI / 2 + 0.6);
  daisy(e, { x: 477, y: 529 }, 70, -Math.PI / 2 - 0.3);
  return project('Wildflower sampler', e);
}
