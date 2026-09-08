import type { ViewStyle } from 'react-native';
import type { Layer } from '../../../core';
import { structuralKey } from '../../../core/hash';

const styles = new Map<string, { normal: ViewStyle; highlighted: ViewStyle }>();

export function stylesFor(layer: Layer): { normal: ViewStyle; highlighted: ViewStyle } {
  const key = structuralKey([layer.id, layer.style]);
  let result = styles.get(key);
  if (!result) {
    const normal: ViewStyle = {
      backgroundColor: layer.style.color,
      opacity: layer.style.opacity ?? 1,
      width: '100%',
      height: '100%',
    };
    result = {
      normal,
      highlighted: { ...normal, backgroundColor: layer.style.highlightColor ?? layer.style.color },
    };
    styles.set(key, result);
  }
  return result;
}
