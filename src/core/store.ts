/** Minimal external store with shallow-merge updates, consumed via useSyncExternalStore. */
export class Store<T extends object> {
  private listeners = new Set<() => void>();

  constructor(private state: T) {}

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  get(): T {
    return this.state;
  }

  set(patch: Partial<T> | ((prev: T) => Partial<T>)): void {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    let changed = false;
    for (const key in next) {
      if (this.state[key] !== next[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    this.state = { ...this.state, ...next };
    for (const fn of this.listeners) fn();
  }
}
