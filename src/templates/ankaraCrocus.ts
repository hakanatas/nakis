import type { ProjectData } from '../core/types';
import { backLine, cloud, crossBlock, fill, knot, leafShape, petalShape, project, pt, sun, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const PETAL = '#f2c33d';
const PETAL_2 = '#ef9640';
const STAMEN = '#c93b3b';
const STEM = '#6f9a4f';
const LEAF = '#4b7236';
const SOIL = '#8b5a3c';
const SNOW = '#f9f6ef';

export const ankaraCrocusSpecies: SpeciesInfo = {
  name: 'Ankara çiğdemi',
  latin: 'Crocus ancyrensis',
  group: 'Çiçek',
  emoji: '🌼',
  region: 'Ankara ve çevresindeki bozkırlar',
  habitat: 'Kayalık yamaçlar ve çayırlar',
  status: 'nadir',
  fact: 'Kar erir erimez açan ilk çiçeklerdendir. Turuncu-sarı taç yaprakları güneşte açılır, akşam kapanır.',
  why: 'Soğanı sökülünce bir daha çiçek açamaz. Kırda görünce koparmadan izlemek en iyisi.',
};

function crocus(e: StitchList, x: number, base: number, size: number, color: string) {
  const top = base - size * 1.6;
  backLine(e, [pt(x, base), pt(x, top)], STEM, 3.2, 8);
  fill(e, leafShape(pt(x, base), pt(x - size * 0.8, base - size * 2.2), size * 0.12), LEAF, -1.2, 3);
  fill(e, leafShape(pt(x, base), pt(x + size * 0.7, base - size * 2), size * 0.12), LEAF, 1.2, 3);
  const angles = [-Math.PI / 2 - 0.85, -Math.PI / 2 - 0.42, -Math.PI / 2, -Math.PI / 2 + 0.42, -Math.PI / 2 + 0.85];
  angles.forEach((a, i) => {
    fill(e, petalShape(pt(x, top), a, 0, size, size * 0.28), i % 2 ? PETAL_2 : color, a, 3.2);
  });
  knot(e, pt(x, top - size * 0.35), STAMEN, 3.6);
  knot(e, pt(x - 6, top - size * 0.3), PETAL_2, 3);
  knot(e, pt(x + 6, top - size * 0.3), PETAL_2, 3);
}

export function buildAnkaraCrocus(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(570, 140), 28, PETAL, '#e8b73a');
  cloud(e, pt(160, 150), 120);

  // soil with melting snow patches
  crossBlock(e, 100, 600, 500, 40, SOIL, 2.4);
  fill(e, [pt(110, 600), pt(190, 586), pt(250, 600), pt(110, 600)], SNOW, 0, 3);
  fill(e, [pt(430, 600), pt(500, 582), pt(590, 600), pt(430, 600)], SNOW, 0, 3);

  crocus(e, 240, 600, 62, PETAL);
  crocus(e, 350, 600, 78, PETAL);
  crocus(e, 470, 600, 58, PETAL);
  crocus(e, 160, 600, 40, PETAL);
  crocus(e, 545, 600, 44, PETAL);
  return project('Ankara çiğdemi', e);
}
