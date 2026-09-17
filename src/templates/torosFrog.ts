import type { Point, ProjectData } from '../core/types';
import { backLine, chainLine, ellipse, fill, knot, project, pt, sun, type StitchList } from './helpers';
import type { SpeciesInfo } from './species';

const GREEN = '#6f9a4f';
const GREEN_DARK = '#4b7236';
const BELLY = '#e9d5b8';
const ROCK = '#9aa3ad';
const ROCK_DARK = '#6f757c';
const SNOW = '#f9f6ef';
const LAKE = '#4f8fd0';
const LAKE_LIGHT = '#3fb8b4';
const INK = '#1b1b1b';
const WHITE = '#f9f6ef';
const REED = '#8b5a3c';
const YELLOW = '#f2c33d';

export const torosFrogSpecies: SpeciesInfo = {
  name: 'Toros kurbağası',
  latin: 'Rana holtzi',
  group: 'Kurbağa',
  emoji: '🐸',
  region: 'Niğde, Bolkar Dağları (Karagöl ve Çinigöl)',
  habitat: '2.500 metre yükseklikteki soğuk buzul gölleri',
  status: 'tehlikede',
  fact: 'Dünyada yalnızca iki küçük dağ gölünde yaşar. Kışı gölün dibinde, buzun altında geçirir.',
  why: 'Göle balık bırakılması ve kirlilik yavrularını yok eder. Dağ göllerini temiz bırakmak onu korur.',
};

export function buildTorosFrog(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(590, 130), 24, YELLOW, '#e8b73a');

  // Bolkar mountains with snow caps
  fill(e, [pt(60, 430), pt(230, 190), pt(400, 430), pt(60, 430)], ROCK, Math.PI / 2, 3.4);
  fill(e, [pt(300, 430), pt(490, 230), pt(660, 430), pt(300, 430)], ROCK_DARK, Math.PI / 2, 3.4);
  fill(e, [pt(198, 236), pt(230, 190), pt(262, 236), pt(198, 236)], SNOW, 0, 3);
  fill(e, [pt(458, 264), pt(490, 230), pt(522, 264), pt(458, 264)], SNOW, 0, 3);

  // glacier lake
  fill(e, ellipse(pt(350, 520), 270, 70, 0, 28), LAKE, 0, 3.4);
  const wave = (y: number, amp: number, phase: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 16; i++) pts.push(pt(140 + i * 26, y + Math.sin(i * 0.9 + phase) * amp));
    chainLine(e, pts, LAKE_LIGHT, 2.8, 9);
  };
  wave(500, 4, 0);
  wave(552, 4, 1.5);

  // reeds
  for (const x of [110, 132, 590, 612]) {
    backLine(e, [pt(x, 600), pt(x + 4, 470)], GREEN_DARK, 2.8, 9);
    fill(e, ellipse(pt(x + 5, 468), 6, 18), REED, Math.PI / 2, 2.6);
  }

  // rock the frog sits on
  fill(e, ellipse(pt(350, 610), 130, 42), ROCK_DARK, 0, 3.4);

  // frog
  fill(e, ellipse(pt(262, 560), 48, 28, 0.5), GREEN_DARK, 0.5, 3.2);
  fill(e, ellipse(pt(438, 560), 48, 28, -0.5), GREEN_DARK, -0.5, 3.2);
  fill(e, ellipse(pt(350, 520), 96, 62), GREEN, Math.PI / 2, 3.4);
  fill(e, ellipse(pt(350, 545), 60, 26), BELLY, 0, 3);
  fill(e, ellipse(pt(350, 452), 72, 46), GREEN, Math.PI / 2, 3.4);
  fill(e, ellipse(pt(314, 414), 20, 20), GREEN_DARK, 0, 3);
  fill(e, ellipse(pt(386, 414), 20, 20), GREEN_DARK, 0, 3);
  knot(e, pt(314, 414), WHITE, 6);
  knot(e, pt(386, 414), WHITE, 6);
  knot(e, pt(316, 414), INK, 3);
  knot(e, pt(388, 414), INK, 3);
  backLine(e, [pt(300, 466), pt(350, 482), pt(400, 466)], GREEN_DARK, 2.4, 7);
  knot(e, pt(334, 440), GREEN_DARK, 2.4);
  knot(e, pt(366, 440), GREEN_DARK, 2.4);
  for (const [x, y] of [
    [300, 510],
    [330, 496],
    [372, 500],
    [398, 522],
    [318, 530],
    [382, 534],
  ]) {
    knot(e, pt(x, y), GREEN_DARK, 3.2);
  }
  // front legs and toes
  backLine(e, [pt(300, 560), pt(284, 596)], GREEN, 5, 9);
  backLine(e, [pt(400, 560), pt(416, 596)], GREEN, 5, 9);
  for (const [x, y] of [
    [284, 596],
    [416, 596],
  ]) {
    backLine(e, [pt(x, y), pt(x - 14, y + 8)], GREEN, 2.6, 6);
    backLine(e, [pt(x, y), pt(x, y + 12)], GREEN, 2.6, 6);
    backLine(e, [pt(x, y), pt(x + 14, y + 8)], GREEN, 2.6, 6);
  }
  return project('Toros kurbağası', e);
}
