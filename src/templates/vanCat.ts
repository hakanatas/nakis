import type { Point, ProjectData } from '../core/types';
import {
  backLine,
  chainLine,
  cloud,
  crossBlock,
  ellipse,
  fill,
  knot,
  project,
  pt,
  rect,
  runningLine,
  sun,
  type StitchList,
} from './helpers';
import type { SpeciesInfo } from './species';

const FUR = '#f9f6ef';
const FUR_EDGE = '#d8d2c7';
const PINK = '#f0a3a0';
const BLUE = '#4f8fd0';
const AMBER = '#e0a83a';
const INK = '#1b1b1b';
const BROWN = '#8b5a3c';
const WHISKER = '#b8b8b8';
const LAKE = '#4f8fd0';
const LAKE_LIGHT = '#3fb8b4';
const RUG = '#c93b3b';
const RUG_2 = '#f2c33d';
const YELLOW = '#f2c33d';

export const vanCatSpecies: SpeciesInfo = {
  name: 'Van kedisi',
  latin: 'Felis catus (Van kedisi ırkı)',
  group: 'Memeli',
  emoji: '🐱',
  region: 'Van ve Van Gölü çevresi',
  habitat: 'Evler, bahçeler ve göl kıyısı',
  status: 'koruma',
  fact: 'Gözleri iki farklı renkte olabilir: biri mavi, biri kehribar. Suyu ve yüzmeyi seven ender kedilerdendir.',
  why: 'Van Yüzüncü Yıl Üniversitesi’ndeki özel merkez bu ırkı korur ve tanıtır. Safkan Van kedisi sayısı azdır.',
};

export function buildVanCat(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(130, 130), 26, YELLOW, '#e8b73a');
  cloud(e, pt(520, 120), 120);

  // lake behind the cat
  const wave = (y: number, amp: number, color: string, phase: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) pts.push(pt(80 + i * 27, y + Math.sin(i * 0.9 + phase) * amp));
    chainLine(e, pts, color, 3.2, 9);
  };
  wave(600, 6, LAKE, 0);
  wave(628, 7, LAKE_LIGHT, 1.3);
  wave(656, 6, LAKE, 2.6);

  // rug
  crossBlock(e, 190, 540, 320, 20, RUG, 2.4);
  crossBlock(e, 190, 560, 320, 10, RUG_2, 2.4);

  // body, legs, tail
  fill(e, ellipse(pt(350, 430), 120, 92), FUR, Math.PI / 2, 3.4);
  chainLine(e, ellipse(pt(350, 430), 120, 92), FUR_EDGE, 2.4, 8);
  fill(e, rect(298, 462, 42, 92, 14), FUR, Math.PI / 2, 3.2);
  fill(e, rect(360, 462, 42, 92, 14), FUR, Math.PI / 2, 3.2);
  backLine(e, [pt(300, 552), pt(340, 552)], FUR_EDGE, 2.4, 7);
  backLine(e, [pt(362, 552), pt(402, 552)], FUR_EDGE, 2.4, 7);
  for (const x of [306, 319, 332, 368, 381, 394]) backLine(e, [pt(x, 540), pt(x, 552)], FUR_EDGE, 1.8, 6);
  chainLine(e, [pt(462, 480), pt(520, 470), pt(556, 420), pt(548, 350), pt(505, 318)], FUR, 6, 12);
  chainLine(e, [pt(462, 480), pt(520, 470), pt(556, 420), pt(548, 350), pt(505, 318)], FUR_EDGE, 2, 12);

  // head and ears
  fill(e, [pt(292, 215), pt(276, 138), pt(338, 200), pt(292, 215)], FUR, -1.1, 3.2);
  fill(e, [pt(408, 215), pt(424, 138), pt(362, 200), pt(408, 215)], FUR, 1.1, 3.2);
  fill(e, [pt(298, 206), pt(288, 160), pt(326, 200), pt(298, 206)], PINK, -1.1, 2.8);
  fill(e, [pt(402, 206), pt(412, 160), pt(374, 200), pt(402, 206)], PINK, 1.1, 2.8);
  fill(e, ellipse(pt(350, 272), 82, 74), FUR, 0, 3.4);
  chainLine(e, ellipse(pt(350, 272), 82, 74), FUR_EDGE, 2.4, 8);

  // face: one blue eye, one amber eye
  knot(e, pt(318, 262), BLUE, 6);
  knot(e, pt(382, 262), AMBER, 6);
  knot(e, pt(318, 262), INK, 2.8);
  knot(e, pt(382, 262), INK, 2.8);
  knot(e, pt(350, 292), PINK, 4.2);
  backLine(e, [pt(350, 296), pt(340, 308)], BROWN, 2, 6);
  backLine(e, [pt(350, 296), pt(360, 308)], BROWN, 2, 6);
  for (const side of [-1, 1]) {
    const x0 = 350 + side * 52;
    runningLine(e, [pt(x0, 288), pt(x0 + side * 62, 276)], WHISKER, 1.8, 7);
    runningLine(e, [pt(x0, 297), pt(x0 + side * 66, 298)], WHISKER, 1.8, 7);
    runningLine(e, [pt(x0, 306), pt(x0 + side * 60, 320)], WHISKER, 1.8, 7);
  }
  return project('Van kedisi', e);
}
