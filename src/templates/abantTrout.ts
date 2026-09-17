import type { Point, ProjectData } from '../core/types';
import { backLine, chainLine, fill, knot, project, pt, runningLine, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const SILVER = '#9aa3ad';
const BACK = '#6f9a4f';
const BELLY = '#e9d5b8';
const FIN = '#4b7236';
const RED = '#c93b3b';
const INK = '#1b1b1b';
const WHITE = '#f9f6ef';
const WATER = '#4f8fd0';
const WATER_2 = '#3fb8b4';
const REED = '#4b7236';

export const abantTroutSpecies: SpeciesInfo = {
  name: 'Abant alası',
  latin: 'Salmo abanticus',
  group: 'Balık',
  emoji: '🐟',
  region: 'Bolu, Abant Gölü',
  habitat: 'Serin ve temiz dağ gölü',
  status: 'hassas',
  fact: 'Vücudunda kırmızı ve siyah benekler vardır. Dünyada başka hiçbir gölde yaşamaz.',
  why: 'Temiz su olmadan yaşayamaz. Gölü temiz tutmak ve yabancı balık bırakmamak onu korur.',
};

export function buildAbantTrout(): ProjectData {
  const e: StitchList = [];

  // water
  const wave = (y: number, amp: number, color: string, phase: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) pts.push(pt(80 + i * 27, y + Math.sin(i * 0.9 + phase) * amp));
    chainLine(e, pts, color, 3.2, 9);
  };
  wave(180, 6, WATER, 0);
  wave(230, 7, WATER_2, 1.4);
  wave(560, 7, WATER_2, 2.8);
  wave(610, 6, WATER, 0.7);
  wave(660, 6, WATER_2, 2.1);

  // reeds
  for (const x of [100, 124, 590, 616]) backLine(e, [pt(x, 690), pt(x + 6, 520)], REED, 3, 10);

  // fish body
  const body: Point[] = [
    pt(150, 400),
    pt(215, 342),
    pt(330, 320),
    pt(440, 340),
    pt(520, 382),
    pt(544, 400),
    pt(520, 420),
    pt(440, 462),
    pt(330, 482),
    pt(215, 460),
    pt(150, 400),
  ];
  fill(e, body, SILVER, 0, 3.6);
  fill(e, [pt(215, 342), pt(330, 320), pt(440, 340), pt(520, 382), pt(440, 368), pt(330, 352), pt(215, 366), pt(215, 342)], BACK, 0.1, 3.4);
  fill(e, [pt(215, 460), pt(330, 482), pt(440, 462), pt(440, 446), pt(330, 462), pt(215, 444), pt(215, 460)], BELLY, 0, 3);
  // tail and fins
  fill(e, [pt(538, 400), pt(612, 344), pt(596, 400), pt(612, 456), pt(538, 400)], FIN, 0, 3.4);
  fill(e, [pt(300, 326), pt(346, 268), pt(404, 332), pt(300, 326)], FIN, Math.PI / 2, 3.2);
  fill(e, [pt(470, 348), pt(486, 322), pt(500, 360), pt(470, 348)], FIN, Math.PI / 2, 3);
  fill(e, [pt(250, 436), pt(232, 486), pt(304, 452), pt(250, 436)], FIN, 0.4, 3.2);
  fill(e, [pt(420, 460), pt(414, 500), pt(462, 452), pt(420, 460)], FIN, 0.4, 3);
  backLine(e, [pt(544, 400), pt(612, 344)], INK, 1.8, 8);
  backLine(e, [pt(544, 400), pt(612, 456)], INK, 1.8, 8);

  // face
  knot(e, pt(206, 386), WHITE, 6);
  knot(e, pt(208, 386), INK, 3);
  backLine(e, [pt(150, 400), pt(192, 412)], INK, 2, 7);
  backLine(e, [pt(222, 370), pt(236, 430)], FIN, 2.2, 8);
  runningLine(e, [pt(240, 402), pt(520, 400)], WHITE, 1.8, 8);

  // spots
  for (const [x, y] of [
    [280, 380],
    [330, 420],
    [370, 372],
    [410, 424],
    [450, 392],
    [300, 440],
    [490, 412],
  ]) {
    knot(e, pt(x, y), RED, 3.6);
  }
  for (const [x, y] of [
    [260, 356],
    [310, 346],
    [360, 342],
    [420, 352],
    [470, 372],
    [350, 400],
    [400, 396],
  ]) {
    knot(e, pt(x, y), INK, 2.8);
  }
  // bubbles
  for (const [x, y] of [
    [120, 372],
    [104, 344],
    [126, 314],
  ]) {
    knot(e, pt(x, y), WHITE, 3.2);
  }
  return project('Abant alası', e);
}
