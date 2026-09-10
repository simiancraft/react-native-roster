import { Text } from 'react-native';

/** Adapter cache hits for the current window, under the shared counters. */
export function ExpansionNote({ cacheHits }: { cacheHits: number }) {
  return <Text className="text-xs text-muted-foreground">Expansion cache hits {cacheHits}</Text>;
}
