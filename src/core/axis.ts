import type { Weekday, Window } from './types';
import { dateEpoch, dateString, dayMilliseconds, localDateAt, startOfDate } from './zone';

export type Span = 'day' | 'week' | 'month';
/** The anchor is a local calendar date in `timezone`, not an instant, so a zone change keeps the same local week. */
export type WindowSpec =
  | { span: Span; anchorDate: string; wkst?: Weekday; timezone: string }
  | { span: 'custom'; window: Window; timezone: string };

export function windowFor(spec: WindowSpec): Window {
  if (spec.span === 'custom') return spec.window;
  const date = new Date(dateEpoch(spec.anchorDate));
  if (spec.span === 'week') {
    const weekday = (date.getUTCDay() + 6) % 7;
    date.setUTCDate(date.getUTCDate() - ((weekday - (spec.wkst ?? 0) + 7) % 7));
  }
  if (spec.span === 'month') date.setUTCDate(1);
  const start = startOfDate(dateString(date.getTime()), spec.timezone);
  if (spec.span === 'month') date.setUTCMonth(date.getUTCMonth() + 1);
  else date.setUTCDate(date.getUTCDate() + (spec.span === 'week' ? 7 : 1));
  return { start, end: startOfDate(dateString(date.getTime()), spec.timezone) };
}

export function prev(spec: WindowSpec): WindowSpec {
  return move(spec, -1);
}

export function next(spec: WindowSpec): WindowSpec {
  return move(spec, 1);
}

export function today(spec: WindowSpec): WindowSpec {
  const anchorDate = localDateAt(Date.now(), spec.timezone);
  if (spec.span !== 'custom') return { ...spec, anchorDate };
  const start = startOfDate(anchorDate, spec.timezone);
  return { ...spec, window: { start, end: start + spec.window.end - spec.window.start } };
}

function move(spec: WindowSpec, direction: number): WindowSpec {
  if (spec.span === 'custom') {
    const delta = direction * (spec.window.end - spec.window.start);
    return { ...spec, window: { start: spec.window.start + delta, end: spec.window.end + delta } };
  }
  const time = dateEpoch(spec.anchorDate);
  if (spec.span !== 'month') {
    return {
      ...spec,
      anchorDate: dateString(time + direction * (spec.span === 'week' ? 7 : 1) * dayMilliseconds),
    };
  }
  const date = new Date(time);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction + 1);
  date.setUTCDate(0);
  date.setUTCDate(Math.min(day, date.getUTCDate()));
  return { ...spec, anchorDate: dateString(date.getTime()) };
}
