import { Pressable, Text } from 'react-native';
import { useStoredScheme } from './use-stored-scheme';

const GLYPH = { dark: '☾', light: '☀' } as const;
const NEXT = { dark: 'light', light: 'dark' } as const;

/** Sun and moon switch; the choice persists across reloads. */
export function ThemeToggle() {
  const { scheme, choose } = useStoredScheme();
  const next = NEXT[scheme];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${next} mode`}
      onPress={() => choose(next)}
      className="h-6 w-6 items-center justify-center rounded-full border border-border bg-card active:bg-accent"
    >
      <Text className="text-[11px] leading-none text-foreground">{GLYPH[scheme]}</Text>
    </Pressable>
  );
}
