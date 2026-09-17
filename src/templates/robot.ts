import type { ProjectData } from '../core/types';
import {
  backLine,
  crossBlock,
  ellipse,
  fill,
  flower,
  knot,
  project,
  pt,
  rect,
  runningLine,
  type StitchList,
} from './helpers';

const NAVY = '#34465a';
const TEAL = '#3fb8b4';
const ORANGE = '#ef9640';
const YELLOW = '#f2c33d';
const GREY = '#9aa3ad';
const INK = '#1b1b1b';
const V = Math.PI / 2;
const H = 0;

export function buildRobot(): ProjectData {
  const e: StitchList = [];
  runningLine(e, [pt(240, 650), pt(350, 655), pt(460, 650)], GREY, 2.4, 9);

  // legs and feet
  fill(e, rect(282, 492, 56, 108, 8), NAVY, V, 3.4);
  fill(e, rect(362, 492, 56, 108, 8), NAVY, V, 3.4);
  fill(e, rect(282, 540, 56, 14), ORANGE, H, 3);
  fill(e, rect(362, 540, 56, 14), ORANGE, H, 3);
  fill(e, rect(262, 598, 86, 36, 12), GREY, H, 3.4);
  fill(e, rect(352, 598, 86, 36, 12), GREY, H, 3.4);
  backLine(e, [pt(268, 616), pt(342, 616)], INK, 1.8, 7);
  backLine(e, [pt(358, 616), pt(432, 616)], INK, 1.8, 7);

  // arms
  for (const side of [-1, 1]) {
    const x = 350 + side * 118;
    fill(e, ellipse(pt(x, 302), 24, 24), TEAL, V, 3.2);
    knot(e, pt(x, 302), GREY, 3.2);
    const left = x - 18;
    fill(e, rect(left, 322, 36, 112, 10), NAVY, V, 3.4);
    fill(e, rect(left - 6, 434, 48, 78, 12), TEAL, V, 3.2);
    fill(e, rect(left - 6, 466, 48, 10), ORANGE, H, 2.8);
    backLine(e, [pt(x - 12, 512), pt(x - 20, 540), pt(x - 10, 566)], NAVY, 4.2, 8);
    backLine(e, [pt(x + 12, 512), pt(x + 20, 540), pt(x + 10, 566)], NAVY, 4.2, 8);
  }

  // torso
  fill(e, rect(240, 280, 220, 194, 22), NAVY, H, 3.6);
  fill(e, rect(240, 474, 220, 20, 6), ORANGE, H, 3);
  for (const [x, y] of [
    [256, 296],
    [444, 296],
    [256, 458],
    [444, 458],
  ]) {
    knot(e, pt(x, y), GREY, 3);
  }
  fill(e, rect(288, 302, 124, 100, 12), TEAL, V, 3.2);
  crossBlock(e, 300, 310, 100, 20, INK, 2);
  flower(e, pt(350, 366), 30, YELLOW, ORANGE, 8, Math.PI / 8, 3);
  for (let i = 0; i < 3; i++) {
    backLine(e, [pt(256, 336 + i * 16), pt(276, 336 + i * 16)], TEAL, 2.4, 6);
    backLine(e, [pt(424, 336 + i * 16), pt(444, 336 + i * 16)], TEAL, 2.4, 6);
  }
  knot(e, pt(322, 484), YELLOW, 3.4);
  knot(e, pt(350, 484), TEAL, 3.4);
  knot(e, pt(378, 484), YELLOW, 3.4);

  // neck and head
  fill(e, rect(326, 252, 48, 30, 6), GREY, V, 3.2);
  fill(e, rect(276, 148, 148, 108, 20), NAVY, V, 3.6);
  fill(e, rect(254, 184, 24, 40, 6), ORANGE, V, 3);
  fill(e, rect(422, 184, 24, 40, 6), ORANGE, V, 3);
  fill(e, rect(292, 172, 116, 46, 14), TEAL, H, 3.2);
  knot(e, pt(322, 195), YELLOW, 5.6);
  knot(e, pt(378, 195), YELLOW, 5.6);
  knot(e, pt(322, 195), INK, 2.6);
  knot(e, pt(378, 195), INK, 2.6);
  backLine(e, [pt(322, 236), pt(378, 236)], TEAL, 3, 7);
  for (let i = 0; i < 4; i++) backLine(e, [pt(330 + i * 13, 230), pt(330 + i * 13, 242)], TEAL, 2.2, 6);

  // antenna
  backLine(e, [pt(350, 148), pt(350, 116)], GREY, 3.4, 8);
  knot(e, pt(350, 110), ORANGE, 4.6);
  for (const side of [-1, 1]) {
    backLine(e, [pt(350 + side * 20, 96), pt(350 + side * 26, 110), pt(350 + side * 20, 124)], YELLOW, 2.4, 7);
    backLine(e, [pt(350 + side * 34, 86), pt(350 + side * 44, 110), pt(350 + side * 34, 134)], YELLOW, 2.4, 7);
  }
  return project('Robot', e);
}
