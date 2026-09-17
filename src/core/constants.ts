import type { StitchType } from './types';

export const STITCH_TYPES: StitchType[] = [
  'running',
  'back',
  'cross',
  'chain',
  'satin',
  'french-knot',
  'lazy-daisy',
];

export const STITCH_LABELS: Record<StitchType, string> = {
  running: 'Running Stitch',
  back: 'Back Stitch',
  cross: 'Cross Stitch',
  chain: 'Chain Stitch',
  satin: 'Satin Stitch',
  'french-knot': 'French Knot',
  'lazy-daisy': 'Lazy Daisy',
};

export const GRID_SIZE = 10;
export const DOC_WIDTH = 700;
export const DOC_HEIGHT = 740;

let idCounter = 0;

export function newId(): string {
  idCounter = (idCounter + 1) % 1e6;
  return `${Date.now().toString(36)}${idCounter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}
