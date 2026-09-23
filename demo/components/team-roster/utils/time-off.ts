import type { Source } from 'react-native-roster/core';

/** What removed time means per source id suffix. */
const TIME_OFF = new Map<string, (source: Source) => string>([
  ['lunch', () => 'Lunch break'],
  ['pto', (source) => source.label ?? 'Out of office'],
]);

export type ProvenanceBasedGapPresentation = {
  meaning: 'partial' | 'wholeDay' | 'neutral';
  label?: string;
  className: string;
};

const NEUTRAL_GAP: ProvenanceBasedGapPresentation = {
  meaning: 'neutral',
  className: 'bg-background/70',
};

/** Showcase gap meaning from one recognized authored source, independent of projection geometry. */
export function timeOffPresentation(sources: readonly Source[]): ProvenanceBasedGapPresentation {
  if (sources.length !== 1) return NEUTRAL_GAP;
  const source = sources[0];
  const suffix = source?.id.split(':').at(-1);
  if (!source || !suffix) return NEUTRAL_GAP;
  if (source.kind === 'rule' && suffix === 'lunch') {
    return {
      meaning: 'partial',
      label: TIME_OFF.get(suffix)?.(source),
      className: 'bg-background/70',
    };
  }
  if (source.kind === 'date' && suffix === 'pto') {
    return {
      meaning: 'wholeDay',
      label: TIME_OFF.get(suffix)?.(source),
      className: 'border border-dashed border-grid-strong bg-muted/60',
    };
  }
  return NEUTRAL_GAP;
}

/** The note for a removed span's first source, or undefined for an unknown suffix. */
export function timeOffNote(source: Source | undefined): string | undefined {
  const suffix = source?.id.split(':').at(-1);
  return source && suffix ? TIME_OFF.get(suffix)?.(source) : undefined;
}
