import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { readStoredScheme, type StoredScheme, storeScheme } from './utils/storage';

/** The active scheme; restores the stored choice once on mount, which is lifecycle, not derived state. */
export function useStoredScheme() {
  const { colorScheme, setColorScheme } = useColorScheme();
  useEffect(() => {
    const stored = readStoredScheme();
    if (stored) setColorScheme(stored);
  }, [setColorScheme]);
  function choose(scheme: StoredScheme) {
    storeScheme(scheme);
    setColorScheme(scheme);
  }
  return { scheme: colorScheme ?? 'light', choose };
}
