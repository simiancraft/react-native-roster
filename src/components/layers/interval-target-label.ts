import type { IntervalTargetInput } from './interval-target.types';

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timezone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'shortOffset',
    });
    formatters.set(timezone, formatter);
  }
  return formatter;
}

export function intervalTargetLabel({
  kind,
  layer,
  lane,
  bounds,
  viewTimezone,
  rect,
}: Pick<
  IntervalTargetInput,
  'kind' | 'layer' | 'lane' | 'bounds' | 'viewTimezone' | 'rect'
>): string {
  const format = formatterFor(viewTimezone);
  const meaning = kind === 'gap' ? 'removed time' : `${layer.label ?? layer.role} interval`;
  const sources = rect.sources.map((source) => source.label?.trim() || source.id).join(', ');
  return `${lane.label}: ${meaning}, ${format.format(bounds.start)} to ${format.format(bounds.end)}${sources ? `, sources ${sources}` : ''}`;
}
