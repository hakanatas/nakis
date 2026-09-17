import { AddStitchCommand, EraseCommand, ReplaceDocumentCommand, type EraseEntry } from './commands';
import { EmbroideryDocument } from './document';
import { exportJSON, exportPNG } from './export';
import { makeFabricAsync, makeFabricSync } from './fabric';
import { History } from './history';
import { InputController } from './input';
import { CanvasRenderer } from './renderer';
import { loadProject, saveProject } from './storage';
import { Store } from './store';
import { buildStitch, CrossStitch, GENERATORS, prepareStroke } from './stitches';
import type { FabricTextureResult, Point, Primitive, ProjectData, StitchSettings, StitchType, Tool } from './types';
import { Viewport } from './viewport';
import { defaultProject, findTemplate } from '../templates';

/** Thread colours, tuned to Türkiye's nature: snow, sand, pollen, apricot, poppy, lake, moss, bark. */
export const PALETTE = [
  '#f9f6ef', // kar beyazı
  '#e9d5b8', // kum
  '#f2c33d', // polen sarısı
  '#ef9640', // kayısı
  '#f0a3a0', // pembe
  '#c93b3b', // gelincik kırmızısı
  '#c77dd1', // lavanta
  '#4f8fd0', // göl mavisi
  '#3fb8b4', // deniz yeşili
  '#6f9a4f', // yaprak yeşili
  '#4b7236', // çam yeşili
  '#8b5a3c', // ağaç kabuğu
  '#9aa3ad', // kaya grisi
  '#1b1b1b', // is siyahı
];

export interface EditorState {
  tool: Tool;
  stitchType: StitchType;
  color: string;
  length: number;
  thickness: number;
  showGrid: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  revision: number;
  fabricVersion: number;
  stitchCount: number;
  /** name of the loaded project (matches a template name when one is loaded) */
  docName: string;
  dirty: boolean;
  saving: boolean;
  ready: boolean;
  toast: { id: number; text: string } | null;
}

const INITIAL_STATE: EditorState = {
  tool: 'needle',
  stitchType: 'running',
  color: '#c93b3b',
  length: 8,
  thickness: 3,
  showGrid: false,
  zoom: 1,
  canUndo: false,
  canRedo: false,
  revision: 0,
  fabricVersion: 0,
  stitchCount: 0,
  docName: '',
  dirty: false,
  saving: false,
  ready: false,
  toast: null,
};

const AUTOSAVE_MS = 2500;

/** Application controller: owns the document, view, history and canvas plumbing. */
export class Editor {
  readonly doc = new EmbroideryDocument();
  readonly viewport = new Viewport();
  readonly history = new History();
  readonly store = new Store<EditorState>(INITIAL_STATE);
  fabric: FabricTextureResult;
  renderer: CanvasRenderer | null = null;

  private input: InputController | null = null;
  private eraseBuffer: EraseEntry[] | null = null;
  private autosaveTimer: ReturnType<typeof setTimeout> | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private cancelHiRes: (() => void) | null = null;
  private unsubStore: (() => void) | null = null;

  constructor() {
    this.fabric = makeFabricSync(2);
    this.cancelHiRes = makeFabricAsync(4, (tex) => {
      this.fabric = tex;
      this.renderer?.setFabric(tex);
      this.store.set((s) => ({ fabricVersion: s.fabricVersion + 1 }));
    });
    this.doc.subscribe(() => {
      this.store.set({ revision: this.doc.revision, stitchCount: this.doc.count, docName: this.doc.name, dirty: true });
      this.viewport.bounds = this.doc.frame();
      this.renderer?.invalidateStitches();
      this.scheduleAutosave();
    });
    this.history.subscribe(() => this.store.set({ canUndo: this.history.canUndo, canRedo: this.history.canRedo }));
    this.viewport.subscribe(() => this.store.set({ zoom: this.viewport.scale }));
  }

  async init(): Promise<void> {
    let data: ProjectData | null = null;
    try {
      data = await loadProject();
    } catch {
      data = null;
    }
    if (!data || !Array.isArray(data.stitches) || data.stitches.length === 0) data = defaultProject();
    this.doc.load(data);
    this.viewport.bounds = this.doc.frame();
    this.history.clear();
    if (this.viewport.width > 0) this.fit();
    this.store.set({ dirty: false, ready: true, docName: this.doc.name });
  }

  attach(
    stage: HTMLElement,
    fabricCanvas: HTMLCanvasElement,
    stitchCanvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement,
  ): void {
    this.detach();
    this.renderer = new CanvasRenderer(this.doc, this.viewport, fabricCanvas, stitchCanvas, overlayCanvas, this.fabric);
    this.input = new InputController(this, stage);
    const sync = () => {
      const s = this.store.get();
      const ov = this.renderer!.overlay;
      ov.showGrid = s.showGrid;
      ov.gridEmphasis = s.stitchType === 'cross' ? 1.5 : 1;
      ov.needle.thread = s.color;
      ov.needle.visible = ov.needle.visible && s.tool === 'needle';
      this.renderer!.invalidateOverlay();
    };
    this.unsubStore = this.store.subscribe(sync);
    sync();
  }

  detach(): void {
    this.renderer?.dispose();
    this.renderer = null;
    this.input?.dispose();
    this.input = null;
    this.unsubStore?.();
    this.unsubStore = null;
  }

  dispose(): void {
    this.detach();
    this.cancelHiRes?.();
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
  }

  resize(width: number, height: number, dpr: number, first: boolean): void {
    const hadSize = this.viewport.width > 0;
    const center = this.viewport.toDoc({ x: this.viewport.width / 2, y: this.viewport.height / 2 });
    this.viewport.setSize(width, height);
    this.renderer?.resize(width, height, dpr);
    if (first || !hadSize) this.fit();
    else this.viewport.centerOn(center);
  }

  settings(): StitchSettings {
    const s = this.store.get();
    return { color: s.color, thickness: s.thickness, length: s.length };
  }

  setTool(tool: Tool): void {
    this.store.set({ tool });
  }

  setStitchType(stitchType: StitchType): void {
    const tool = this.store.get().tool;
    this.store.set({ stitchType, tool: tool === 'eraser' ? 'needle' : tool });
  }

  setColor(color: string): void {
    this.store.set({ color });
  }

  setLength(length: number): void {
    this.store.set({ length });
  }

  setThickness(thickness: number): void {
    this.store.set({ thickness });
  }

  toggleGrid(on?: boolean): void {
    this.store.set((s) => ({ showGrid: on ?? !s.showGrid }));
  }

  crossCell(): number {
    return CrossStitch.cellSize(this.store.get().length);
  }

  previewStroke(raw: Point[]): Primitive[] {
    const type = this.store.get().stitchType;
    const pts = prepareStroke(raw, type);
    return GENERATORS[type].generate(pts.length ? pts : raw, this.settings());
  }

  commitStroke(raw: Point[]): void {
    if (raw.length === 0) return;
    const type = this.store.get().stitchType;
    const pts = prepareStroke(raw, type);
    const stitch = buildStitch(type, pts.length ? pts : raw, this.settings());
    if (stitch.geometry.length === 0) return;
    this.history.push(new AddStitchCommand(this.doc, stitch));
    this.renderer?.settle(stitch);
  }

  beginErase(): void {
    this.eraseBuffer = [];
  }

  eraseAt(p: Point, radius: number): void {
    const hits = this.doc.hitTestAll(p, radius);
    if (hits.length === 0) return;
    for (const s of hits) {
      this.eraseBuffer?.push({ stitch: s, index: this.doc.indexOf(s.id) });
    }
    this.doc.removeMany(hits.map((s) => s.id));
  }

  endErase(): void {
    if (this.eraseBuffer && this.eraseBuffer.length) this.history.record(new EraseCommand(this.doc, this.eraseBuffer));
    this.eraseBuffer = null;
  }

  pickColorAt(p: Point, radius: number): string | null {
    const s = this.doc.hitTest(p, radius);
    return s ? s.color : null;
  }

  undo(): void {
    if (this.history.undo()) this.toast('Undone');
  }

  redo(): void {
    if (this.history.redo()) this.toast('Redone');
  }

  fit(): void {
    this.viewport.fitRect(this.doc.frame(), 28);
  }

  zoomBy(factor: number): void {
    this.viewport.zoomAt({ x: this.viewport.width / 2, y: this.viewport.height / 2 }, factor);
  }

  toast(text: string): void {
    const id = Date.now();
    this.store.set({ toast: { id, text } });
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      if (this.store.get().toast?.id === id) this.store.set({ toast: null });
    }, 1800);
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);
    this.autosaveTimer = setTimeout(() => {
      this.autosaveTimer = null;
      if (this.store.get().dirty) void this.save(true);
    }, AUTOSAVE_MS);
  }

  async save(silent = false): Promise<void> {
    this.store.set({ saving: true });
    try {
      await saveProject(this.doc.toJSON());
      this.store.set({ dirty: false });
      if (!silent) this.toast('Saved to this browser');
    } catch {
      if (!silent) this.toast('Could not save: storage is unavailable');
    } finally {
      this.store.set({ saving: false });
    }
  }

  async exportPNG(scale: number): Promise<void> {
    try {
      const result = await exportPNG(this.doc, this.fabric, scale);
      this.toast(result === 'saved' ? `PNG exported at ${scale}x` : 'Export cancelled');
    } catch {
      this.toast('Export failed');
    }
  }

  async exportJSON(): Promise<void> {
    try {
      const result = await exportJSON(this.doc);
      this.toast(result === 'saved' ? 'Project JSON exported' : 'Export cancelled');
    } catch {
      this.toast('Export failed');
    }
  }

  private replaceDocument(label: string, next: ProjectData): void {
    const before = this.doc.toJSON();
    this.history.push(new ReplaceDocumentCommand(label, this.doc, before, next));
    this.fit();
  }

  loadTemplate(id: string): void {
    const t = findTemplate(id);
    this.replaceDocument(`Load ${t.name}`, t.build());
    this.toast(`${t.name} template loaded`);
  }

  reset(): void {
    this.replaceDocument('Reset', defaultProject());
    this.toast('Reset to the default template. Undo brings your work back.');
  }

  clearAll(): void {
    const empty: ProjectData = { ...this.doc.toJSON(), stitches: [], name: 'Untitled embroidery' };
    this.replaceDocument('Clear canvas', empty);
    this.toast('Canvas cleared');
  }

  async importJSON(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as ProjectData;
      if (!data || data.version !== 1 || !Array.isArray(data.stitches)) throw new Error('bad');
      this.replaceDocument('Import project', data);
      this.toast(`Imported ${data.stitches.length} stitches`);
    } catch {
      this.toast('That file is not a StitchCraft project');
    }
  }
}
