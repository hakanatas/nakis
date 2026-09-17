import { hash } from './geom';
import type { FabricTextureResult } from './types';

const THREAD_PX = 4;
const TILE = 192;
const BASE_RGB = [255, 250, 238];
const LX = -0.45;
const LY = -0.55;
const LZ = 0.7;
const LLEN = Math.hypot(LX, LY, LZ);
const LIGHT3 = [LX / LLEN, LY / LLEN, LZ / LLEN];

/** Procedurally woven linen texture, generated row by row so it can be built incrementally. */
export class FabricTexture {
  readonly W: number;
  readonly H: number;
  readonly image: ImageData;
  y = 0;

  private readonly period: number;
  private readonly nThreads: number;
  private readonly colIdx: Int32Array;
  private readonly colProf: Float32Array;
  private readonly colDeriv: Float32Array;
  private readonly warpTone: Float32Array;
  private readonly weftTone: Float32Array;
  private readonly weftW: Float32Array;
  private readonly lf: Float32Array;
  private readonly lfCell: number;
  private readonly lfN: number;

  constructor(readonly tile: number, readonly res: number) {
    this.W = Math.round(tile * res);
    this.H = this.W;
    this.image = new ImageData(this.W, this.H);
    this.period = THREAD_PX * res;
    this.nThreads = Math.round(tile / THREAD_PX);
    const n = this.nThreads;
    this.warpTone = new Float32Array(n);
    const warpW = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.warpTone[i] = 1 + (hash(i, 1) - 0.5) * 0.09;
      warpW[i] = 0.9 + hash(i, 2) * 0.14;
    }
    this.weftTone = new Float32Array(n);
    this.weftW = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      this.weftTone[i] = 1 + (hash(i, 3) - 0.5) * 0.09;
      this.weftW[i] = 0.9 + hash(i, 4) * 0.14;
    }
    this.colIdx = new Int32Array(this.W);
    this.colProf = new Float32Array(this.W);
    this.colDeriv = new Float32Array(this.W);
    for (let x = 0; x < this.W; x++) {
      const u = x / this.period;
      const idx = Math.min(n - 1, Math.floor(u));
      const frac = u - Math.floor(u);
      this.colIdx[x] = idx;
      this.colProf[x] = Math.pow(Math.sin(Math.PI * frac), 0.6) * warpW[idx];
      this.colDeriv[x] = Math.cos(Math.PI * frac);
    }
    this.lfN = 4;
    this.lfCell = this.W / this.lfN;
    this.lf = new Float32Array(this.lfN * this.lfN);
    for (let j = 0; j < this.lfN; j++) {
      for (let i = 0; i < this.lfN; i++) this.lf[j * this.lfN + i] = hash(i + 7, j + 13);
    }
  }

  get done(): boolean {
    return this.y >= this.H;
  }

  get progress(): number {
    return this.y / this.H;
  }

  private lowFreq(x: number, y: number): number {
    const n = this.lfN;
    const u = x / this.lfCell;
    const v = y / this.lfCell;
    const i0 = Math.floor(u) % n;
    const j0 = Math.floor(v) % n;
    const fu = u - Math.floor(u);
    const fv = v - Math.floor(v);
    const i1 = (i0 + 1) % n;
    const j1 = (j0 + 1) % n;
    const a = this.lf[j0 * n + i0];
    const b = this.lf[j0 * n + i1];
    const c = this.lf[j1 * n + i0];
    const d = this.lf[j1 * n + i1];
    return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv;
  }

  /** Renders up to `rows` more rows. Returns true when the whole tile is finished. */
  step(rows: number): boolean {
    const { W, period, colIdx, colProf, colDeriv, warpTone, weftTone, weftW, nThreads } = this;
    const data = this.image.data;
    const yEnd = Math.min(this.H, this.y + rows);
    for (let y = this.y; y < yEnd; y++) {
      const v = y / period;
      const row = Math.min(nThreads - 1, Math.floor(v));
      const frac = v - Math.floor(v);
      const rowProf = Math.pow(Math.sin(Math.PI * frac), 0.6) * weftW[row];
      const rowDeriv = Math.cos(Math.PI * frac);
      let o = y * W * 4;
      for (let x = 0; x < W; x++) {
        const col = colIdx[x];
        const warpOnTop = ((col + row) & 1) === 0;
        const warpH = colProf[x] * (warpOnTop ? 1 : 0.74);
        const weftH = rowProf * (warpOnTop ? 0.74 : 1);
        let height: number;
        let tone: number;
        let nx = 0;
        let ny = 0;
        let noise: number;
        if (warpH >= weftH) {
          height = warpH;
          tone = warpTone[col];
          nx = -colDeriv[x] * 1.5 * (warpOnTop ? 1 : 0.74);
          noise = hash(x, (y >> 1) + col * 31);
        } else {
          height = weftH;
          tone = weftTone[row];
          ny = -rowDeriv * 1.5 * (warpOnTop ? 0.74 : 1);
          noise = hash((x >> 1) + row * 31, y);
        }
        const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        const ndl = (nx * LIGHT3[0] + ny * LIGHT3[1] + LIGHT3[2]) * inv;
        const diffuse = 0.76 + 0.27 * (ndl > 0 ? ndl : 0);
        const ao = 0.7 + 0.3 * Math.min(1, height / 0.55);
        const grain = 1 + (noise - 0.5) * 0.08;
        const cloud = 0.965 + this.lowFreq(x, y) * 0.07;
        const k = tone * diffuse * ao * grain * cloud;
        data[o] = Math.min(255, BASE_RGB[0] * k);
        data[o + 1] = Math.min(255, BASE_RGB[1] * k * (0.985 + 0.015 * height));
        data[o + 2] = Math.min(255, BASE_RGB[2] * k * (0.96 + 0.04 * height));
        data[o + 3] = 255;
        o += 4;
      }
    }
    this.y = yEnd;
    return this.done;
  }

  toTexture(): FabricTextureResult {
    const canvas = document.createElement('canvas');
    canvas.width = this.W;
    canvas.height = this.H;
    canvas.getContext('2d')!.putImageData(this.image, 0, 0);
    return { canvas, res: this.res, tile: this.tile };
  }
}

/** Fills a document-space rectangle with the repeating fabric texture. */
export function fillFabric(
  ctx: CanvasRenderingContext2D,
  tex: FabricTextureResult,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const pattern = ctx.createPattern(tex.canvas, 'repeat');
  if (!pattern) {
    ctx.fillStyle = '#efe9dc';
    ctx.fillRect(x, y, w, h);
    return;
  }
  const s = 1 / tex.res;
  pattern.setTransform(new DOMMatrix([s, 0, 0, s, 0, 0]));
  ctx.fillStyle = pattern;
  ctx.fillRect(x, y, w, h);
}

/** Dashed "hoop" border drawn in screen space around the stage. */
export function drawHoopBorder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
): void {
  const inset = 12 * scale;
  if (w < inset * 3 || h < inset * 3) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.setLineDash([5 * scale, 4.2 * scale]);
  ctx.strokeStyle = 'rgba(80, 60, 40, 0.22)';
  ctx.lineWidth = 1.7 * scale;
  ctx.strokeRect(x + inset + 0.5 * scale, y + inset + 0.7 * scale, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = 'rgba(158, 132, 96, 0.9)';
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  ctx.restore();
}

export function makeFabricSync(res: number): FabricTextureResult {
  const tex = new FabricTexture(TILE, res);
  tex.step(tex.H);
  return tex.toTexture();
}

/** Builds a higher-resolution texture in small time slices; returns a cancel function. */
export function makeFabricAsync(res: number, done: (tex: FabricTextureResult) => void): () => void {
  const tex = new FabricTexture(TILE, res);
  let cancelled = false;
  const tick = () => {
    if (cancelled) return;
    const start = performance.now();
    while (!tex.done && performance.now() - start < 8) tex.step(32);
    if (tex.done) done(tex.toTexture());
    else setTimeout(tick, 16);
  };
  setTimeout(tick, 120);
  return () => {
    cancelled = true;
  };
}
