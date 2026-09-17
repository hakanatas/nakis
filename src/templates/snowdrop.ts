import type { ProjectData } from '../core/types';
import { backLine, crossBlock, fill, knot, leafShape, petalShape, project, pt, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const PETAL = '#f9f6ef';
const PETAL_EDGE = '#c9c3b8';
const GREEN = '#6f9a4f';
const GREEN_DARK = '#4b7236';
const SNOW = '#f9f6ef';
const SOIL = '#6b4128';
const PINE = '#2f5a3e';
const TRUNK = '#8b5a3c';

export const snowdropSpecies: SpeciesInfo = {
  name: 'Kaz Dağı kardeleni',
  latin: 'Galanthus trojanus',
  group: 'Çiçek',
  emoji: '❄️',
  region: 'Çanakkale, Kaz Dağları',
  habitat: 'Gölgeli, nemli orman altları',
  status: 'nadir',
  fact: 'Kar altından çıkıp açtığı için adı "kardelen"dir. Beyaz çiçekleri başını hep aşağı eğer.',
  why: 'Soğanları sökülüp satıldığı için azalıyor. Ormanda gördüğün kardeleni yerinde bırak.',
};

function snowdropPlant(e: StitchList, x: number, base: number, height: number) {
  const top = base - height;
  backLine(e, [pt(x, base), pt(x, top)], GREEN, 3, 8);
  backLine(e, [pt(x, top), pt(x + 12, top - 10), pt(x + 28, top + 4)], GREEN, 2.6, 7);
  fill(e, leafShape(pt(x, base), pt(x - 26, base - height * 0.8), 7), GREEN_DARK, -1.3, 3);
  fill(e, leafShape(pt(x + 2, base), pt(x + 22, base - height * 0.72), 6), GREEN_DARK, 1.3, 3);
  const c = pt(x + 28, top + 8);
  knot(e, c, GREEN, 4);
  for (const a of [Math.PI / 2 - 0.5, Math.PI / 2, Math.PI / 2 + 0.5]) {
    fill(e, petalShape(c, a, 2, 54, 13), PETAL, a, 3.2);
  }
  backLine(e, [pt(c.x - 8, c.y + 40), pt(c.x, c.y + 50), pt(c.x + 8, c.y + 40)], GREEN, 2, 6);
  knot(e, pt(c.x, c.y + 54), PETAL_EDGE, 2.4);
}

function pine(e: StitchList, x: number, base: number, h: number) {
  fill(e, [pt(x - 4, base), pt(x - 4, base - h * 0.2), pt(x + 4, base - h * 0.2), pt(x + 4, base), pt(x - 4, base)], TRUNK, Math.PI / 2, 2.8);
  const w = h * 0.45;
  fill(e, [pt(x - w, base - h * 0.2), pt(x, base - h * 0.6), pt(x + w, base - h * 0.2), pt(x - w, base - h * 0.2)], PINE, 0, 3.2);
  fill(e, [pt(x - w * 0.8, base - h * 0.5), pt(x, base - h * 0.85), pt(x + w * 0.8, base - h * 0.5), pt(x - w * 0.8, base - h * 0.5)], PINE, 0, 3.2);
  fill(e, [pt(x - w * 0.55, base - h * 0.75), pt(x, base - h), pt(x + w * 0.55, base - h * 0.75), pt(x - w * 0.55, base - h * 0.75)], PINE, 0, 3.2);
}

export function buildSnowdrop(): ProjectData {
  const e: StitchList = [];
  pine(e, 120, 600, 220);
  pine(e, 590, 600, 260);

  crossBlock(e, 90, 600, 520, 30, SNOW, 2.4);
  backLine(e, [pt(80, 632), pt(350, 634), pt(620, 632)], SOIL, 3.4, 10);

  snowdropPlant(e, 240, 600, 170);
  snowdropPlant(e, 340, 600, 210);
  snowdropPlant(e, 440, 600, 160);

  for (const [x, y] of [
    [200, 160],
    [300, 120],
    [420, 150],
    [520, 110],
    [160, 260],
    [480, 240],
    [360, 200],
  ]) {
    knot(e, pt(x, y), SNOW, 3.4);
  }
  return project('Kaz Dağı kardeleni', e);
}
