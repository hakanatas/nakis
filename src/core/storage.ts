import type { ProjectData } from './types';

const DB_NAME = 'stitchcraft';
const STORE = 'projects';
const CURRENT_KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Could not open database'));
  });
}

export async function saveProject(data: ProjectData): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(data, CURRENT_KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Save failed'));
  });
  db.close();
}

export async function loadProject(): Promise<ProjectData | null> {
  const db = await openDb();
  const data = await new Promise<ProjectData | null>((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(CURRENT_KEY);
    req.onsuccess = () => resolve((req.result as ProjectData | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error('Load failed'));
  });
  db.close();
  return data;
}
