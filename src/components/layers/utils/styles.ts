import type { ViewStyle } from 'react-native';
import type { Layer } from '../../../core';
import { registerCacheClear } from '../../../core/cache';
import { structuralKey } from '../../../core/hash';
import { touch, trim } from '../../../core/lru';

export const layerStyleCacheLimit = 2_000;
const styles = new Map<string, { normal: ViewStyle; highlighted: ViewStyle }>();

registerCacheClear(() => styles.clear());

export function stylesFor(layer: Layer): { normal: ViewStyle; highlighted: ViewStyle } {
  const key = structuralKey([layer.id, layer.style]);
  let result = styles.get(key);
  if (result) return touch(styles, key, result);

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
  touch(styles, key, result);
  trim(styles, layerStyleCacheLimit);
  return result;
}
