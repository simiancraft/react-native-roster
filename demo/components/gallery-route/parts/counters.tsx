import { Text, View } from 'react-native';
import type { CounterSnapshot } from '../counter-bridge.types';

export function GalleryCounters({
  snapshot,
  selection,
}: {
  snapshot: CounterSnapshot;
  selection: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontSize: 12, color: '#334155' }}>
        Expanded {snapshot.expanded ?? 0} · Layout {snapshot.layout.runs} runs /{' '}
        {snapshot.layout.cacheHits} hits · Coverage {snapshot.coverage.runs} runs /{' '}
        {snapshot.coverage.cacheHits} hits
      </Text>
      <Text
        testID="roster-selection"
        accessibilityLiveRegion="polite"
        numberOfLines={2}
        style={{ fontSize: 12, color: '#334155' }}
      >
        {selection}
      </Text>
    </View>
  );
}
