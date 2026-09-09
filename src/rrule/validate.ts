import type { Window } from '../core';
import type { RosterDate, RosterRule } from './types';

export function validateWindow(window: Window): void {
  if (
    !Number.isSafeInteger(window.start) ||
    !Number.isSafeInteger(window.end) ||
    window.start > window.end
  ) {
    throw new RangeError('window must have integer epoch milliseconds with start <= end');
  }
}

export function nonnegativeInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RangeError(`${name} must be a nonnegative integer`);
  return value;
}

export function validateInput(input: RosterRule | RosterDate): void {
  if (!input.id || !['include', 'exclude'].includes(input.kind)) {
    throw new RangeError('Each rule or date needs an id and an include or exclude kind');
  }
  // Bound date strings before any regex sees them; a full offset-and-zone
  // form is under 50 characters, and unbounded input would scan quadratically.
  for (const name of ['dtstart', 'until', 'date'] as const) {
    const value =
      name in input ? (input as Partial<Record<typeof name, unknown>>)[name] : undefined;
    if (value !== undefined && (typeof value !== 'string' || value.length > 64))
      throw new RangeError(`${input.id}: ${name} must be a string of at most 64 characters`);
  }
  const { hourstart, hourend } = input;
  if ((hourstart === undefined) !== (hourend === undefined)) {
    throw new RangeError(`${input.id}: hourstart and hourend must both be present or both absent`);
  }
  if ('frequency' in input) {
    if (!['DAILY', 'WEEKLY', 'MONTHLY'].includes(input.frequency))
      throw new RangeError('Unsupported frequency');
    if (hourstart === undefined) throw new RangeError('Rules require hourstart and hourend');
    for (const name of ['count', 'interval'] as const) {
      const value = input[name];
      if (value !== undefined && (!Number.isSafeInteger(value) || value <= 0))
        throw new RangeError(`${name} must be a positive integer`);
    }
    validateNumbers(input.wkst === undefined ? undefined : [input.wkst], 'wkst', 0, 6);
    validateNumbers(input.byweekday, 'byweekday', 0, 6);
    validateNumbers(input.bymonth, 'bymonth', 1, 12);
    validateNumbers(input.bymonthday, 'bymonthday', -31, 31, true);
    validateNumbers(input.bysetpos, 'bysetpos', -366, 366, true);
  }
  if (
    hourstart !== undefined &&
    hourend !== undefined &&
    (!Number.isFinite(hourstart) ||
      !Number.isFinite(hourend) ||
      hourstart < 0 ||
      hourstart >= hourend ||
      hourend > 24)
  ) {
    throw new RangeError(`${input.id}: hours must satisfy 0 <= hourstart < hourend <= 24`);
  }
}

function validateNumbers(
  values: number[] | undefined,
  name: string,
  min: number,
  max: number,
  nonzero = false,
): void {
  if (
    values?.some(
      (value) => !Number.isInteger(value) || value < min || value > max || (nonzero && value === 0),
    )
  ) {
    throw new RangeError(`Invalid ${name}`);
  }
}
