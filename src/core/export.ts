import { EmbroideryDocument } from './document';
import { drawHoopBorder, fillFabric } from './fabric';
import { drawStitches } from './render';
import type { FabricTextureResult, Rect } from './types';

/** Renders a document rectangle into a fresh canvas at the given scale. */
export function renderDocument(
  doc: EmbroideryDocument,
  fabric: FabricTextureResult,
  scale: number,
  rect: Rect = doc.frame(),
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.w * scale));
  canvas.height = Math.max(1, Math.round(rect.h * scale));
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.setTransform(scale, 0, 0, scale, -rect.x * scale, -rect.y * scale);
  fillFabric(ctx, fabric, rect.x, rect.y, rect.w, rect.h);
  drawStitches(ctx, doc.queryRect(rect), { quality: scale < 0.5 ? 'fast' : 'full' });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHoopBorder(ctx, 0, 0, canvas.width, canvas.height, Math.max(0.5, scale));
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png'): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), type);
  });
}

type SaveResult = 'saved' | 'declined';

interface ClaudeDownloads {
  save(opts: { filename: string; data: Blob | string }): Promise<unknown>;
}

interface ClaudeRuntime {
  use?: (name: string) => Promise<ClaudeDownloads | null | undefined>;
}

/**
 * Saves a file. When hosted inside a claude.ai artifact the `downloads` capability is used,
 * otherwise a regular anchor download is triggered.
 */
export async function saveFile(data: Blob | string, filename: string): Promise<SaveResult> {
  const runtime = (window as unknown as { claude?: ClaudeRuntime }).claude;
  if (runtime && typeof runtime.use === 'function') {
    try {
      const downloads = await runtime.use('downloads');
      if (downloads) {
        try {
          await downloads.save({ filename, data });
          return 'saved';
        } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'declined') return 'declined';
          if (code && code !== 'unavailable' && code !== 'not_granted') throw err;
        }
      }
    } catch {
      // fall through to the anchor download
    }
  }
  const blob = typeof data === 'string' ? new Blob([data], { type: 'application/json' }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'saved';
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'embroidery'
  );
}

export async function exportPNG(doc: EmbroideryDocument, fabric: FabricTextureResult, scale: number): Promise<SaveResult> {
  const canvas = renderDocument(doc, fabric, scale);
  const blob = await canvasToBlob(canvas);
  return saveFile(blob, `${slugify(doc.name)}${scale > 1 ? `-${scale}x` : ''}.png`);
}

export async function exportJSON(doc: EmbroideryDocument): Promise<SaveResult> {
  const json = JSON.stringify(doc.toJSON(), null, 2);
  return saveFile(new Blob([json], { type: 'application/json' }), `${slugify(doc.name)}.json`);
}
