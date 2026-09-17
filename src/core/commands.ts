import type { EmbroideryDocument } from './document';
import type { Command } from './history';
import type { ProjectData, Stitch } from './types';

export class AddStitchCommand implements Command {
  readonly label = 'Add stitch';

  constructor(
    private doc: EmbroideryDocument,
    private stitch: Stitch,
  ) {}

  execute(): void {
    this.doc.add(this.stitch);
  }

  undo(): void {
    this.doc.remove(this.stitch.id);
  }
}

export interface EraseEntry {
  stitch: Stitch;
  index: number;
}

export class EraseCommand implements Command {
  readonly label = 'Erase';

  constructor(
    private doc: EmbroideryDocument,
    private entries: EraseEntry[],
  ) {}

  execute(): void {
    this.doc.removeMany(this.entries.map((e) => e.stitch.id));
  }

  undo(): void {
    const sorted = [...this.entries].sort((a, b) => a.index - b.index);
    for (const e of sorted) this.doc.add(e.stitch, e.index);
  }
}

export class ReplaceDocumentCommand implements Command {
  constructor(
    readonly label: string,
    private doc: EmbroideryDocument,
    private before: ProjectData,
    private after: ProjectData,
  ) {}

  execute(): void {
    this.doc.load(this.after);
  }

  undo(): void {
    this.doc.load(this.before);
  }
}
