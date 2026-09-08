import { Text } from 'react-native';
import type { Lane, LaneGeometry } from '../../../core';

export function RosterIncomplete({
  lane,
  geometry,
  width,
  label,
}: {
  lane: Lane;
  geometry: LaneGeometry;
  width: number;
  label: string;
}) {
  if (lane.complete !== false) return null;
  // Choose the first empty span; the notice never covers an interval.
  let left = 0;
  let right = width;
  for (const rect of [...geometry.rects].sort((a, b) => a.x - b.x)) {
    if (rect.x > left) {
      right = rect.x;
      break;
    }
    left = Math.max(left, rect.x + rect.width);
  }
  if (left >= right) return null;
  return (
    <Text
      testID={`roster-incomplete-${lane.id}`}
      pointerEvents="none"
      numberOfLines={1}
      style={{
        position: 'absolute',
        left,
        width: right - left,
        top: 4,
        color: '#64748b',
        fontSize: 12,
      }}
    >
      {label}
    </Text>
  );
}
