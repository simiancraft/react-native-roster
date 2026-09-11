const STORAGE_KEY = 'roster-demo-theme';

export type StoredScheme = 'light' | 'dark';

export function readStoredScheme(): StoredScheme | null {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Storage is best effort; private windows and native have none. */
export function storeScheme(scheme: StoredScheme): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, scheme);
  } catch {}
}
