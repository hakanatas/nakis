import type { Point, ProjectData } from '../core/types';
import {
  backLine,
  cloud,
  crossBlock,
  daisyPetal,
  ellipse,
  fill,
  flower,
  knot,
  project,
  pt,
  rect,
  runningLine,
  sun,
  type StitchList,
} from './helpers';

const WALL = '#efe0c6';
const ROOF = '#b5533c';
const WOOD = '#8b5a3c';
const WINDOW = '#9cc7ee';
const BLUE = '#4f8fd0';
const STONE = '#b8b8b8';
const LEAF = '#6f9a4f';
const LEAF_DARK = '#4b7236';
const PINK = '#f0a3a0';
const YELLOW = '#f2c33d';
const CREAM = '#f9f6ef';
const SMOKE = '#c9c3b8';
const V = Math.PI / 2;
const H = 0;

function archDoor(x: number, y: number, w: number, h: number): Point[] {
  const r = w / 2;
  const out: Point[] = [pt(x, y + h), pt(x, y + r)];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    out.push(pt(x + r + Math.cos(a) * r, y + r + Math.sin(a) * r));
  }
  out.push(pt(x + w, y + h), pt(x, y + h));
  return out;
}

export function buildCottage(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(590, 150), 26, YELLOW, '#e8b73a');
  cloud(e, pt(170, 140), 130);
  cloud(e, pt(430, 110), 100);

  // ground and grass
  backLine(e, [pt(60, 560), pt(350, 560), pt(640, 560)], LEAF_DARK, 3.4, 10);
  for (let i = 0; i < 14; i++) {
    const x = 70 + i * 42 + (i % 2) * 9;
    if (x > 190 && x < 490) continue;
    daisyPetal(e, pt(x, 560), pt(x - 6, 536), LEAF, 2.6);
    daisyPetal(e, pt(x, 560), pt(x + 7, 534), LEAF, 2.6);
  }

  // tree
  fill(e, rect(100, 470, 24, 92, 6), WOOD, V, 3.4);
  fill(e, ellipse(pt(112, 410), 62, 72), LEAF, V, 3.6);
  fill(e, ellipse(pt(80, 440), 34, 30), LEAF_DARK, V, 3.2);
  fill(e, ellipse(pt(150, 430), 36, 32), LEAF_DARK, V, 3.2);
  for (const [x, y] of [
    [92, 386],
    [128, 372],
    [142, 418],
    [96, 434],
    [120, 452],
  ]) {
    knot(e, pt(x, y), '#c93b3b', 3.4);
  }

  // house
  fill(e, rect(200, 330, 280, 230), WALL, H, 3.6);
  fill(e, [pt(178, 338), pt(340, 186), pt(502, 338), pt(178, 338)], ROOF, -0.75, 3.6);
  backLine(e, [pt(176, 340), pt(340, 184), pt(504, 340)], WOOD, 3.2, 9);
  for (let i = 1; i < 4; i++) {
    const y = 338 - i * 36;
    const half = ((y - 186) / 152) * 162 - 12;
    runningLine(e, [pt(340 - half, y), pt(340 + half, y)], '#8e3f2d', 2.4, 9);
  }

  // chimney and smoke
  fill(e, rect(412, 214, 34, 82), STONE, H, 3.2);
  fill(e, rect(406, 206, 46, 14), '#8f8f8f', H, 3);
  runningLine(e, [pt(430, 196), pt(438, 176), pt(424, 158), pt(436, 138), pt(426, 118)], SMOKE, 2.4, 7);
  runningLine(e, [pt(444, 190), pt(456, 168), pt(448, 150)], SMOKE, 2.2, 7);

  // door
  fill(e, archDoor(316, 440, 50, 120), WOOD, V, 3.4);
  knot(e, pt(354, 506), YELLOW, 3.2);
  backLine(e, [pt(341, 450), pt(341, 556)], '#6d4630', 1.8, 8);
  fill(e, rect(306, 560, 70, 12), STONE, H, 3);

  // windows with flower boxes
  for (const x of [226, 390]) {
    fill(e, rect(x, 372, 64, 60), WINDOW, H, 3.2);
    backLine(e, [pt(x + 32, 374), pt(x + 32, 430)], CREAM, 2.4, 8);
    backLine(e, [pt(x + 2, 402), pt(x + 62, 402)], CREAM, 2.4, 8);
    backLine(e, [pt(x - 4, 434), pt(x + 68, 434)], WOOD, 3.2, 9);
    backLine(e, [pt(x - 2, 370), pt(x + 66, 370)], WOOD, 2.6, 9);
    fill(e, rect(x - 2, 438, 68, 16, 4), ROOF, H, 3);
    for (let i = 0; i < 4; i++) knot(e, pt(x + 8 + i * 16, 436), i % 2 ? PINK : YELLOW, 3.2);
  }

  // path
  crossBlock(e, 320, 580, 40, 20, STONE, 2.4);
  crossBlock(e, 310, 600, 60, 20, STONE, 2.4);
  crossBlock(e, 300, 620, 80, 20, STONE, 2.4);
  crossBlock(e, 290, 640, 100, 20, STONE, 2.4);

  // fence
  backLine(e, [pt(520, 522), pt(660, 522)], CREAM, 3, 9);
  backLine(e, [pt(520, 546), pt(660, 546)], CREAM, 3, 9);
  for (let i = 0; i < 6; i++) {
    const x = 524 + i * 26;
    backLine(e, [pt(x, 506), pt(x, 562)], CREAM, 3.4, 9);
  }

  // flowers
  const flowers: [number, number][] = [
    [560, 596],
    [610, 606],
    [650, 592],
    [240, 604],
    [200, 620],
  ];
  flower(e, pt(560, 596), 16, PINK, YELLOW, 6, 0.3);
  flower(e, pt(610, 606), 14, CREAM, YELLOW, 6, 0.9);
  flower(e, pt(650, 592), 15, PINK, YELLOW, 6, 0.1);
  flower(e, pt(240, 604), 15, BLUE, YELLOW, 6, 0.5);
  flower(e, pt(200, 620), 13, PINK, YELLOW, 6, 0.2);
  for (const [x, y] of flowers) backLine(e, [pt(x, y + 12), pt(x + 2, y + 30)], LEAF, 2.4, 7);

  return project('Cottage', e);
}
