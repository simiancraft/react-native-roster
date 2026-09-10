import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Compose a chrome region's style. React Native Web renders object styles
 * inline, and inline paint beats any class, so a class entry in the override
 * (NativeWind's `$$css` marker) replaces the region's default paint entirely.
 * Structure always applies; native style overrides simply merge last.
 */
export function regionStyle(
  structure: ViewStyle,
  paint: ViewStyle,
  override: StyleProp<ViewStyle>,
): StyleProp<ViewStyle> {
  return [structure, hasClassEntry(override) ? null : paint, override];
}

function hasClassEntry(style: unknown): boolean {
  if (!style || typeof style !== 'object') return false;
  if (Array.isArray(style)) return style.some((entry) => hasClassEntry(entry));
  return '$$css' in style;
}
