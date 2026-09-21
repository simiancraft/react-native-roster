export function touch<K, V>(cache: Map<K, V>, key: K, value: V): V {
  cache.delete(key);
  cache.set(key, value);
  return value;
}

export function trim<K, V>(cache: Map<K, V>, limit: number): void {
  while (cache.size > limit) {
    const oldest = cache.keys().next();
    if (oldest.done) return;
    cache.delete(oldest.value);
  }
}
