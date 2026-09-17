import type { Rect } from './types';

interface Indexed {
  id: string;
  bounds: Rect;
}

/** Uniform grid spatial index for fast rectangle queries. */
export class SpatialIndex<T extends Indexed> {
  private cells = new Map<string, Set<T>>();
  private itemCells = new Map<string, string[]>();

  constructor(readonly cellSize = 48) {}

  private keysFor(r: Rect): string[] {
    const s = this.cellSize;
    const x0 = Math.floor(r.x / s);
    const y0 = Math.floor(r.y / s);
    const x1 = Math.floor((r.x + r.w) / s);
    const y1 = Math.floor((r.y + r.h) / s);
    const keys: string[] = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) keys.push(`${x},${y}`);
    }
    return keys;
  }

  insert(item: T): void {
    const keys = this.keysFor(item.bounds);
    this.itemCells.set(item.id, keys);
    for (const key of keys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = new Set();
        this.cells.set(key, cell);
      }
      cell.add(item);
    }
  }

  remove(item: T): void {
    const keys = this.itemCells.get(item.id);
    if (!keys) return;
    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        cell.delete(item);
        if (cell.size === 0) this.cells.delete(key);
      }
    }
    this.itemCells.delete(item.id);
  }

  query(r: Rect): T[] {
    const found = new Set<T>();
    for (const key of this.keysFor(r)) {
      const cell = this.cells.get(key);
      if (cell) for (const item of cell) found.add(item);
    }
    return Array.from(found);
  }

  clear(): void {
    this.cells.clear();
    this.itemCells.clear();
  }
}
