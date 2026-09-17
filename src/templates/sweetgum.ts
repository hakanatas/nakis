import type { Point, ProjectData } from '../core/types';
import { backLine, chainLine, daisyPetal, fill, knot, petalShape, project, pt, sun, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const TRUNK = '#8b5a3c';
const BARK = '#6b4128';
const LEAF = '#6f9a4f';
const LEAF_DARK = '#4b7236';
const LEAF_AUTUMN = '#ef9640';
const RESIN = '#e0a83a';
const GRASS = '#6f9a4f';
const WATER = '#4f8fd0';
const YELLOW = '#f2c33d';

export const sweetgumSpecies: SpeciesInfo = {
  name: 'Anadolu sığla ağacı',
  latin: 'Liquidambar orientalis',
  group: 'Ağaç',
  emoji: '🌳',
  region: 'Muğla: Köyceğiz, Fethiye, Marmaris',
  habitat: 'Dere kenarları ve sulak ovalar',
  status: 'hassas',
  fact: 'Yaprakları yıldıza benzer. Gövdesinden güzel kokulu sığla yağı elde edilir.',
  why: 'Dünyadaki sığla ormanlarının neredeyse tamamı Türkiye’dedir. Sulak alanlar kurutulunca ağaçlar da yok olur.',
};

function starLeaf(e: StitchList, c: Point, r: number, color: string, rotation: number) {
  for (let i = 0; i < 5; i++) {
    const a = rotation + (i / 5) * Math.PI * 2;
    fill(e, petalShape(c, a, r * 0.08, r, r * 0.38), color, a, 3);
  }
  knot(e, c, LEAF_DARK, 2.6);
}

export function buildSweetgum(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(120, 120), 24, YELLOW, '#e8b73a');

  // stream
  const wave = (y: number, phase: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) pts.push(pt(80 + i * 27, y + Math.sin(i * 0.9 + phase) * 5));
    chainLine(e, pts, WATER, 3.2, 9);
  };
  wave(640, 0);
  wave(664, 1.6);

  // grass
  for (let i = 0; i < 12; i++) {
    const x = 90 + i * 48;
    daisyPetal(e, pt(x, 612), pt(x - 6, 588), GRASS, 2.4);
    daisyPetal(e, pt(x, 612), pt(x + 7, 586), GRASS, 2.4);
  }

  // trunk and branches
  fill(e, [pt(326, 612), pt(340, 430), pt(360, 430), pt(374, 612), pt(326, 612)], TRUNK, Math.PI / 2, 3.6);
  backLine(e, [pt(350, 455), pt(262, 372)], BARK, 5, 10);
  backLine(e, [pt(350, 440), pt(438, 350)], BARK, 5, 10);
  backLine(e, [pt(350, 480), pt(282, 448)], BARK, 4, 9);
  backLine(e, [pt(350, 470), pt(420, 452)], BARK, 4, 9);
  backLine(e, [pt(350, 430), pt(350, 330)], BARK, 4.6, 10);
  for (const [x, y] of [
    [346, 520],
    [356, 548],
    [349, 580],
  ]) {
    knot(e, pt(x, y), RESIN, 4.2);
  }

  // star-shaped leaves forming the canopy
  const leaves: [number, number, number, string, number][] = [
    [350, 300, 40, LEAF, 0.2],
    [270, 330, 34, LEAF_DARK, 0.6],
    [430, 320, 36, LEAF, 1.1],
    [300, 250, 32, LEAF_AUTUMN, 0.3],
    [410, 250, 34, LEAF_DARK, 0.9],
    [230, 400, 30, LEAF, 0.5],
    [470, 400, 32, LEAF_AUTUMN, 0.1],
    [350, 210, 30, LEAF, 0.7],
    [200, 340, 26, LEAF_AUTUMN, 1.3],
    [500, 340, 28, LEAF_DARK, 0.4],
    [300, 400, 28, LEAF_DARK, 1.0],
    [400, 410, 26, LEAF, 0.8],
    [250, 260, 24, LEAF, 1.5],
    [450, 190, 24, LEAF, 0.2],
  ];
  for (const [x, y, r, color, rot] of leaves) starLeaf(e, pt(x, y), r, color, rot);
  return project('Anadolu sığla ağacı', e);
}
