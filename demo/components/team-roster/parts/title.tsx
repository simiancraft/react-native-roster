import { Text } from 'react-native';
import type { Window } from 'react-native-roster/core';
import type { Density } from '../team-roster.types';
import { conciseRangeLabel, rangeLabel, zoneShort } from '../utils/format';

export function TeamTitle({ title }: { title: string }) {
  return (
    <Text accessibilityRole="header" className="text-2xl font-semibold text-foreground">
      {title}
    </Text>
  );
}

const RANGE: Record<Density, (start: number, end: number, timezone: string) => string> = {
  full: rangeLabel,
  compact: conciseRangeLabel,
  avatar: conciseRangeLabel,
};

/** The visible window, its people count, and the view zone; concise below full density. */
export function WindowRange({
  window,
  timezone,
  density,
  shown,
  total,
}: {
  window: Window;
  timezone: string;
  density: Density;
  shown: number;
  total: number;
}) {
  return (
    <Text className="text-sm text-muted-foreground">
      {RANGE[density](window.start, window.end, timezone)} · {shown} of {total} people ·{' '}
      {zoneShort(timezone)}
    </Text>
  );
}
