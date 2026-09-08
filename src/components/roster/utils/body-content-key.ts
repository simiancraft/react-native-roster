import type { BodyInput } from '../roster.types';

const zoneIds = new WeakMap<object, number>();
let nextZoneId = 0;

function zoneId(zone: object): number {
  let id = zoneIds.get(zone);
  if (id === undefined) {
    id = nextZoneId++;
    zoneIds.set(zone, id);
  }
  return id;
}

export function bodyContentKey({
  window,
  projection,
  highlightSource,
  intervalZone,
  gapZone,
}: Pick<
  BodyInput,
  'window' | 'projection' | 'highlightSource' | 'intervalZone' | 'gapZone'
>): string {
  return JSON.stringify([
    window.start,
    window.end,
    projection.viewTimezone,
    projection.rowHeight,
    projection.pxPerMinute,
    highlightSource?.kind,
    highlightSource?.id,
    zoneId(intervalZone),
    zoneId(gapZone),
  ]);
}
