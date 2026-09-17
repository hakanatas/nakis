import type { Point, ProjectData } from '../core/types';
import { backLine, bird, chainLine, cloud, fill, knot, project, pt, runningLine, sun, type StitchList } from './helpers';

const BLUE = '#4f8fd0';
const TEAL = '#3fb8b4';
const CREAM = '#f9f6ef';
const HULL = '#8b5a3c';
const HULL_DARK = '#6b4128';
const SAIL = '#faf8f1';
const RED = '#c93b3b';
const MAST = '#3b3b3b';
const YELLOW = '#f2c33d';
const ORANGE = '#ef9640';
const NAVY = '#34465a';

export function buildSailboat(): ProjectData {
  const e: StitchList = [];
  sun(e, pt(560, 150), 30, YELLOW, '#e8b73a');
  cloud(e, pt(150, 130), 120);
  cloud(e, pt(430, 90), 90);
  bird(e, pt(220, 220), 16, NAVY);
  bird(e, pt(262, 196), 12, NAVY);
  bird(e, pt(196, 260), 10, NAVY);

  // hull
  fill(e, [pt(196, 476), pt(506, 476), pt(468, 536), pt(236, 536), pt(196, 476)], HULL, 0, 3.6);
  backLine(e, [pt(196, 476), pt(506, 476)], HULL_DARK, 3.2, 10);
  runningLine(e, [pt(214, 500), pt(488, 500)], RED, 2.6, 9);
  for (let i = 0; i < 5; i++) knot(e, pt(262 + i * 44, 518), YELLOW, 3.4);
  fill(e, [pt(380, 446), pt(470, 446), pt(478, 476), pt(372, 476), pt(380, 446)], HULL_DARK, 0, 3.2);
  knot(e, pt(410, 461), YELLOW, 3.2);
  knot(e, pt(440, 461), YELLOW, 3.2);

  // mast and sails
  backLine(e, [pt(346, 476), pt(346, 150)], MAST, 5, 11);
  backLine(e, [pt(346, 444), pt(486, 444)], MAST, 3.6, 10);
  fill(e, [pt(354, 176), pt(354, 436), pt(478, 436), pt(354, 176)], SAIL, Math.PI / 2, 3.4);
  runningLine(e, [pt(354, 330), pt(432, 330)], RED, 2.6, 8);
  runningLine(e, [pt(354, 380), pt(456, 380)], RED, 2.6, 8);
  fill(e, [pt(338, 210), pt(338, 436), pt(222, 436), pt(338, 210)], SAIL, Math.PI / 2, 3.4);
  runningLine(e, [pt(260, 400), pt(338, 400)], BLUE, 2.6, 8);
  backLine(e, [pt(338, 210), pt(222, 436)], NAVY, 2.2, 9);
  backLine(e, [pt(354, 176), pt(478, 436)], NAVY, 2.2, 9);
  fill(e, [pt(346, 146), pt(390, 158), pt(346, 172), pt(346, 146)], ORANGE, 0, 3);

  // waves
  const wave = (y: number, amp: number, color: string, thickness: number, phase: number) => {
    const pts: Point[] = [];
    for (let i = 0; i <= 20; i++) {
      const x = 80 + i * 27;
      pts.push(pt(x, y + Math.sin(i * 0.9 + phase) * amp));
    }
    chainLine(e, pts, color, thickness, 9);
  };
  wave(546, 7, BLUE, 3.6, 0);
  wave(578, 9, TEAL, 3.4, 1.4);
  wave(612, 8, BLUE, 3.6, 2.8);
  wave(646, 7, TEAL, 3.2, 0.7);
  runningLine(e, [pt(120, 562), pt(180, 566), pt(240, 562)], CREAM, 2.2, 7);
  runningLine(e, [pt(420, 596), pt(480, 600), pt(540, 596)], CREAM, 2.2, 7);
  runningLine(e, [pt(220, 630), pt(280, 634), pt(340, 630)], CREAM, 2.2, 7);
  return project('Sailboat', e);
}
