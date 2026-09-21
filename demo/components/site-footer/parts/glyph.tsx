import { Text } from 'react-native';
import type { GlyphName, GlyphProps } from './glyph.types';

const NAMES: Record<GlyphName, string> = {
  github: 'GitHub',
  x: 'X',
  kofi: 'Ko-fi',
  simiancraft: '',
};

/** Native has no inline SVG without another dependency, so it writes the name. */
export function Glyph({ name }: GlyphProps) {
  return <Text className="text-xs text-muted-foreground">{NAMES[name]}</Text>;
}
