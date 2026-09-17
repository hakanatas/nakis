export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type StitchType =
  | 'running'
  | 'back'
  | 'cross'
  | 'chain'
  | 'satin'
  | 'french-knot'
  | 'lazy-daisy';

export type Tool = 'needle' | 'eraser' | 'pan' | 'zoom' | 'eyedropper';

export interface StitchSettings {
  color: string;
  thickness: number;
  length: number;
}

export interface StitchParams {
  /** 1 = fill the closed outline with satin hatching */
  region?: number;
  /** hatch angle in radians (satin fills) */
  angle?: number;
  /** slant of satin bars along an open path */
  slant?: number;
}

export interface HolePrimitive {
  kind: 'hole';
  p: Point;
  r: number;
}

export interface ThreadPrimitive {
  kind: 'thread';
  pts: Point[];
  w: number;
  closed: boolean;
  raised: boolean;
}

export type Primitive = HolePrimitive | ThreadPrimitive;

export interface StitchData {
  id: string;
  type: StitchType;
  points: Point[];
  color: string;
  thickness: number;
  length: number;
  params?: StitchParams;
}

export interface Stitch extends StitchData {
  bounds: Rect;
  geometry: Primitive[];
}

export interface ProjectData {
  version: 1;
  name: string;
  width: number;
  height: number;
  gridSize: number;
  stitches: StitchData[];
  savedAt: number;
}

export interface FabricTextureResult {
  canvas: HTMLCanvasElement;
  res: number;
  tile: number;
}
