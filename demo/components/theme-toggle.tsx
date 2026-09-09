import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';

const STORAGE_KEY = 'roster-demo-theme';

function readStoredScheme(): 'light' | 'dark' | null {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
  } catch {
    return null;
  }
}

/** Restores the stored scheme once on mount; storage is an external store, so this is lifecycle. */
function useStoredScheme() {
  const { colorScheme, setColorScheme } = useColorScheme();
  useEffect(() => {
    const stored = readStoredScheme();
    if (stored) setColorScheme(stored);
  }, [setColorScheme]);
  return { scheme: colorScheme ?? 'light', setColorScheme };
}

const GLYPH = { dark: '☾', light: '☀' } as const;

/** Sun and moon switch; the choice persists across reloads. */
export function ThemeToggle() {
  const { scheme, setColorScheme } = useStoredScheme();
  const next = scheme === 'dark' ? 'light' : 'dark';
  function toggle() {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, next);
    } catch {}
    setColorScheme(next);
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${next} mode`}
      onPress={toggle}
      className="h-6 w-6 items-center justify-center rounded-full border border-border bg-card active:bg-accent"
    >
      <Text className="text-[11px] leading-none text-foreground">{GLYPH[scheme]}</Text>
    </Pressable>
  );
}
