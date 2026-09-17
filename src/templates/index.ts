import type { ProjectData } from '../core/types';
import { buildBalloon } from './balloon';
import { buildCottage } from './cottage';
import { buildRobot } from './robot';
import { buildSailboat } from './sailboat';
import { buildWildflowers } from './wildflowers';

export interface Template {
  id: string;
  name: string;
  description: string;
  build: () => ProjectData;
}

export const TEMPLATES: Template[] = [
  { id: 'robot', name: 'Robot', description: 'Boxy robot with a glowing chest emblem', build: buildRobot },
  { id: 'floral', name: 'Wildflowers', description: 'Satin daisies, buds and leaves', build: buildWildflowers },
  { id: 'cottage', name: 'Cottage', description: 'House, tree, fence and a cross stitch path', build: buildCottage },
  { id: 'sailboat', name: 'Sailboat', description: 'Sailboat on chain stitch waves', build: buildSailboat },
  { id: 'balloon', name: 'Hot air balloon', description: 'Striped balloon with a woven basket', build: buildBalloon },
];

export const DEFAULT_TEMPLATE_ID = 'robot';

export function findTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

export function defaultProject(): ProjectData {
  return findTemplate(DEFAULT_TEMPLATE_ID).build();
}
