import type { ProjectData } from '../core/types';
import { buildAbantTrout, abantTroutSpecies } from './abantTrout';
import { buildAnkaraCrocus, ankaraCrocusSpecies } from './ankaraCrocus';
import { buildBalloon } from './balloon';
import { buildCottage } from './cottage';
import { buildRobot } from './robot';
import { buildSailboat } from './sailboat';
import { buildSnowdrop, snowdropSpecies } from './snowdrop';
import type { SpeciesInfo } from './species';
import { buildSweetgum, sweetgumSpecies } from './sweetgum';
import { buildTorosFrog, torosFrogSpecies } from './torosFrog';
import { buildVanCat, vanCatSpecies } from './vanCat';
import { buildWildflowers } from './wildflowers';
import { buildWildSheep, wildSheepSpecies } from './wildSheep';

export type { SpeciesInfo, ConservationStatus } from './species';
export { STATUS_LABELS } from './species';

export type TemplateGroup = 'endemic' | 'classic';

export interface Template {
  id: string;
  name: string;
  description: string;
  group: TemplateGroup;
  build: () => ProjectData;
  /** Present on the endemic species templates; drives the "Tür Bilgisi" card. */
  species?: SpeciesInfo;
}

export const TEMPLATES: Template[] = [
  // Türkiye'ye özgü (endemik) türler
  { id: 'van-kedisi', name: 'Van kedisi', description: 'Bir gözü mavi, bir gözü kehribar', group: 'endemic', build: buildVanCat, species: vanCatSpecies },
  { id: 'toros-kurbagasi', name: 'Toros kurbağası', description: 'Bolkar’ın buzul gölünde', group: 'endemic', build: buildTorosFrog, species: torosFrogSpecies },
  { id: 'ankara-cigdemi', name: 'Ankara çiğdemi', description: 'Karın altından açan ilk çiçek', group: 'endemic', build: buildAnkaraCrocus, species: ankaraCrocusSpecies },
  { id: 'kardelen', name: 'Kaz Dağı kardeleni', description: 'Başını eğen beyaz çiçek', group: 'endemic', build: buildSnowdrop, species: snowdropSpecies },
  { id: 'sigla', name: 'Sığla ağacı', description: 'Yıldız yapraklı, güzel kokulu', group: 'endemic', build: buildSweetgum, species: sweetgumSpecies },
  { id: 'yaban-koyunu', name: 'Yaban koyunu', description: 'Kıvrımlı boynuzlu bozkır koyunu', group: 'endemic', build: buildWildSheep, species: wildSheepSpecies },
  { id: 'abant-alasi', name: 'Abant alası', description: 'Kırmızı benekli göl balığı', group: 'endemic', build: buildAbantTrout, species: abantTroutSpecies },
  // Klasik desenler
  { id: 'robot', name: 'Robot', description: 'Boxy robot with a glowing chest emblem', group: 'classic', build: buildRobot },
  { id: 'floral', name: 'Wildflowers', description: 'Satin daisies, buds and leaves', group: 'classic', build: buildWildflowers },
  { id: 'cottage', name: 'Cottage', description: 'House, tree, fence and a cross stitch path', group: 'classic', build: buildCottage },
  { id: 'sailboat', name: 'Sailboat', description: 'Sailboat on chain stitch waves', group: 'classic', build: buildSailboat },
  { id: 'balloon', name: 'Hot air balloon', description: 'Striped balloon with a woven basket', group: 'classic', build: buildBalloon },
];

export const DEFAULT_TEMPLATE_ID = 'van-kedisi';

export function findTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/** Finds the template whose project name matches a loaded document (survives undo / import). */
export function templateForDocumentName(name: string): Template | undefined {
  return TEMPLATES.find((t) => t.build().name === name);
}

export function defaultProject(): ProjectData {
  return findTemplate(DEFAULT_TEMPLATE_ID).build();
}
