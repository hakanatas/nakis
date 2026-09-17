import type { Point, ProjectData } from '../core/types';
import {
  backLine,
  bird,
  cloud,
  crossBlock,
  fill,
  knot,
  project,
  pt,
  runningLine,
  type StitchList,
} from './helpers';

const STRIPES = ['#c93b3b', '#f2c33d', '#4f8fd0', '#ef9640', '#3fb8b4', '#c77dd1'];
const BASKET = '#8b5a3c';
const ROPE = '#6b4128';
const BIRD = '#34465a';

const CX = 350;
const TOP = 110;
const EQUATOR = 270;
const RX = 158;
const TOP_H = 160;
const BOTTOM = 468;
const NECK = 26;

function balloonRadius(y: number): number {
  if (y <= EQUATOR) {
    const t = (y - EQUATOR) / TOP_H;
    return RX * Math.sqrt(Math.max(0, 1 - t * t));
  }
  const t = Math.min(1, (y - EQUATOR) / (BOTTOM - EQUATOR));
  const k = 1 - Math.pow(t, 2.2);
  return NECK + (RX - NECK) * k;
}

function stripe(a0: number, a1: number): Point[] {
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= 22; i++) {
    const y = TOP + (i / 22) * (BOTTOM - TOP);
    const r = balloonRadius(y);
    left.push(pt(CX - r * Math.cos(a0), y));
    right.push(pt(CX - r * Math.cos(a1), y));
  }
  right.reverse();
  return [...left, ...right, left[0]];
}

export function buildBalloon(): ProjectData {
  const e: StitchList = [];
  cloud(e, pt(140, 560), 130);
  cloud(e, pt(590, 420), 110);
  cloud(e, pt(560, 640), 150);
  bird(e, pt(130, 300), 14, BIRD);
  bird(e, pt(170, 270), 10, BIRD);

  const n = STRIPES.length;
  for (let i = 0; i < n; i++) {
    fill(e, stripe((i / n) * Math.PI, ((i + 1) / n) * Math.PI), STRIPES[i], Math.PI / 2, 3.4);
  }
  for (let i = 1; i < n; i++) {
    const a = (i / n) * Math.PI;
    const seam: Point[] = [];
    for (let j = 0; j <= 10; j++) {
      const y = TOP + 6 + (j / 10) * (BOTTOM - TOP - 10);
      seam.push(pt(CX - balloonRadius(y) * Math.cos(a), y));
    }
    runningLine(e, seam, '#fdfcfa', 1.8, 8);
  }
  const band: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI;
    band.push(pt(CX - RX * Math.cos(a), EQUATOR + Math.sin(a) * 0));
  }
  backLine(e, band, '#fdfcfa', 3, 9);
  knot(e, pt(CX, TOP - 2), '#1b1b1b', 4);

  backLine(e, [pt(CX - NECK - 2, BOTTOM), pt(CX + NECK + 2, BOTTOM)], ROPE, 3.4, 9);
  backLine(e, [pt(CX - NECK, BOTTOM), pt(CX - 42, 560)], ROPE, 2.4, 9);
  backLine(e, [pt(CX + NECK, BOTTOM), pt(CX + 42, 560)], ROPE, 2.4, 9);
  backLine(e, [pt(CX - 8, BOTTOM), pt(CX - 14, 560)], ROPE, 2, 9);
  backLine(e, [pt(CX + 8, BOTTOM), pt(CX + 14, 560)], ROPE, 2, 9);

  crossBlock(e, 300, 560, 100, 60, BASKET, 2.8);
  backLine(e, [pt(296, 560), pt(404, 560)], ROPE, 3.6, 10);
  backLine(e, [pt(296, 620), pt(404, 620)], ROPE, 3, 10);
  knot(e, pt(292, 596), '#b3a05a', 4.4);
  knot(e, pt(408, 596), '#b3a05a', 4.4);
  return project('Hot air balloon', e);
}
