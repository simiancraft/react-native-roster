import type { BodyInput } from '../roster.types';

const identityIds = new WeakMap<object, number>();
let nextIdentityId = 0;

function identityId(identity: object): number {
  let id = identityIds.get(identity);
  if (id === undefined) {
    id = nextIdentityId++;
    identityIds.set(identity, id);
  }
  return id;
}

export function bodyContentKey({
  window,
  projection,
  highlightSource,
  intervalComponent,
  gapComponent,
  onIntervalHover,
  incompleteLabel,
  incompleteComponent,
}: Pick<
  BodyInput,
  | 'window'
  | 'projection'
  | 'highlightSource'
  | 'intervalComponent'
  | 'gapComponent'
  | 'onIntervalHover'
  | 'incompleteLabel'
  | 'incompleteComponent'
>): string {
  return JSON.stringify([
    window.start,
    window.end,
    projection.viewTimezone,
    projection.rowHeight,
    projection.pxPerMinute,
    highlightSource?.kind,
    highlightSource?.id,
    identityId(intervalComponent),
    identityId(gapComponent),
    onIntervalHover && identityId(onIntervalHover),
    incompleteLabel,
    identityId(incompleteComponent),
  ]);
}
