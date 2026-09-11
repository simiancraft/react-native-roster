import type { Source } from 'react-native-roster/core';

/** What removed time means per source kind; rules are the lunch exclusion, dates are days off. */
const TIME_OFF: Record<string, (source: Source) => string> = {
  rule: () => 'Lunch break',
  date: (source) => source.label ?? 'Out of office',
};

/** The note for a removed span's first source, or undefined when the kind carries none. */
export function timeOffNote(source: Source | undefined): string | undefined {
  return source ? TIME_OFF[source.kind]?.(source) : undefined;
}
