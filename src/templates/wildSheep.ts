import type { Point, ProjectData } from '../core/types';
import { backLine, chainLine, cloud, daisyPetal, ellipse, fill, knot, project, pt, rect, sun, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const COAT = '#a8734a';
const COAT_DARK = '#6b4128';
const BELLY = '#f9f6ef';
const HORN = '#e9d5b8';
const HORN_EDGE = '#b3a05a';
const INK = '#1b1b1b';
const HILL = '#c9b37a';
const HILL_2 = '#b3a05a';
const GRASS = '#6f9a4f';
const YELLOW = '#f2c33d';

export const wildSheepSpecies: SpeciesInfo = {
  name: 'Anadolu yaban koyunu',
  latin: 'Ovis gmelinii anatolica',
  group: 'Memeli',
  emoji: '🐏',
  region: 'Konya, Bozdağ',
  habitat: 'Bozkır ve tepelik alanlar',
  status: 'koruma',
  fact: 'Erkeklerinin kıvrımlı, kocaman boynuzları vardır. Bir zamanlar sayıları 40’a kadar düşmüştü.',
  why: 'Bozdağ’daki koruma sahası sayesinde sayıları binlere çıktı. Korumak işe yarıyor!',
};

function horn(e: StitchList, c: Point, r0: number, r1: number, scale: number) {
  const pts: Point[] = [];
  const n = 26;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -Math.PI * 0.95 + t * Math.PI * 1.85;
    const r = r0 + (r1 - r0) * t;
    pts.push(pt(c.x + Math.cos(a) * r * scale, c.y + Math.sin(a) * r));
  }
  chainLine(e, pts, HORN, 5.5, 11);
  chainLine(e, pts, HORN_EDGE, 2, 11);
}

export function buildWildSheep(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(120, 120), 26, YELLOW, '#e8b73a');
  cloud(e, pt(520, 120), 110);

  // steppe hills
  fill(e, ellipse(pt(180, 640), 220, 90, 0, 24), HILL, 0, 3.4);
  fill(e, ellipse(pt(560, 650), 240, 100, 0, 24), HILL_2, 0, 3.4);

  // legs
  for (const x of [268, 318, 396, 446]) {
    fill(e, rect(x, 500, 26, 108, 8), COAT, Math.PI / 2, 3.2);
    backLine(e, [pt(x - 2, 608), pt(x + 28, 608)], INK, 3, 8);
  }
  // body and belly
  fill(e, ellipse(pt(360, 440), 132, 82), COAT, 0, 3.6);
  fill(e, ellipse(pt(360, 488), 100, 30), BELLY, 0, 3);
  backLine(e, [pt(230, 430), pt(212, 452)], COAT_DARK, 3.4, 8);

  // head
  fill(e, ellipse(pt(504, 380), 56, 42, -0.35), COAT, -0.35, 3.4);
  fill(e, ellipse(pt(548, 400), 22, 15, -0.35), BELLY, -0.35, 3);
  fill(e, ellipse(pt(462, 352), 16, 8, 0.6), COAT_DARK, 0.6, 2.8);
  knot(e, pt(516, 366), INK, 3.6);
  knot(e, pt(566, 404), INK, 3);
  horn(e, pt(462, 316), 16, 74, 1.05);
  horn(e, pt(486, 328), 12, 52, 1.05);

  // grass
  for (let i = 0; i < 11; i++) {
    const x = 96 + i * 50;
    if (x > 250 && x < 480) continue;
    daisyPetal(e, pt(x, 612), pt(x - 6, 588), GRASS, 2.4);
    daisyPetal(e, pt(x, 612), pt(x + 7, 586), GRASS, 2.4);
  }
  return project('Anadolu yaban koyunu', e);
}
