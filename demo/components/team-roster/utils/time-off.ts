import type { Source } from 'react-native-roster/core';

/** What removed time means per source id suffix. */
const TIME_OFF: Record<string, (source: Source) => string> = {
  lunch: () => 'Lunch break',
  pto: (source) => source.label ?? 'Out of office',
};

/** The note for a removed span's first source, or undefined for an unknown suffix. */
export function timeOffNote(source: Source | undefined): string | undefined {
  const suffix = source?.id.split(':').at(-1);
  return source && suffix ? TIME_OFF[suffix]?.(source) : undefined;
}
