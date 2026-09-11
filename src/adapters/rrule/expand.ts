import type { Interval, Source, Window } from '../../core';
import { occurrences, recordStats, retainedEnvelope, touch, trim } from './cache';
import { envelopeFor } from './envelope';
import { bodyKey } from './hash';
import { net } from './net';
import { enumerate, validateDates } from './occurrences';
import type {
  ExpandOptions,
  ExpandResult,
  ExpandStats,
  RosterDate,
  RosterRule,
  RuleSet,
} from './types';
import { nonnegativeInteger, validateInput, validateWindow } from './validate';

export function expandRuleSet(
  set: RuleSet,
  window: Window,
  options: ExpandOptions = {},
): ExpandResult {
  validateWindow(window);
  const maxEntries = nonnegativeInteger(options.cache?.maxEntries ?? 2000, 'cache.maxEntries');
  const maxEnvelopes = nonnegativeInteger(options.cache?.maxEnvelopes ?? 4, 'cache.maxEnvelopes');
  const cap = nonnegativeInteger(
    options.caps?.perRuleOccurrences ?? 400,
    'caps.perRuleOccurrences',
  );
  let remaining = nonnegativeInteger(
    options.caps?.totalOccurrences ?? 10000,
    'caps.totalOccurrences',
  );
  const rules = [...set.rules].sort(byId);
  const dates = [...set.dates].sort(byId);
  const ordered = [...rules, ...dates];
  for (const input of ordered) {
    validateInput(input);
    validateDates(input);
  }
  const stats: ExpandStats = {
    rules: set.rules.length,
    dates: set.dates.length,
    expanded: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };
  if (window.start === window.end) {
    recordStats(stats);
    return {
      intervals: [],
      gaps: [],
      envelope: envelopeFor(window),
      complete: true,
      truncated: [],
      stats,
    };
  }
  const envelope = retainedEnvelope(window, maxEnvelopes);
  trim(occurrences, maxEntries);
  const includes: Interval[] = [];
  const excludes: Interval[] = [];
  const truncated: ExpandResult['truncated'] = [];
  let dropped = false;
  for (const input of ordered) {
    const key = JSON.stringify([bodyKey(input), envelope.start, envelope.end, cap]);
    let list = occurrences.get(key);
    if (list) {
      touch(occurrences, key, list);
      stats.cacheHits++;
    } else {
      list = enumerate(input, envelope, cap);
      touch(occurrences, key, list);
      trim(occurrences, maxEntries);
      stats.expanded++;
      stats.cacheMisses++;
    }
    // No partial admission: the first list that cannot fit ends the admitted
    // prefix. Fetch all later lists anyway to report their exact retained counts.
    dropped ||= list.spans.length > remaining;
    if (dropped || list.capped) {
      truncated.push({
        id: input.id,
        droppedAtLeast: list.capped ? 1 : list.spans.length,
      });
    }
    if (dropped) continue;
    remaining -= list.spans.length;
    const source: Source = { kind: 'date' in input ? 'date' : 'rule', id: input.id };
    if ('date' in input && input.note !== undefined) source.label = input.note;
    const target = input.kind === 'include' ? includes : excludes;
    for (const span of list.spans) target.push({ ...span, sources: [source] });
  }
  recordStats(stats);
  return {
    ...net(includes, excludes, window),
    envelope: { ...envelope },
    complete: truncated.length === 0,
    truncated,
    stats,
  };
}

function byId(a: RosterRule | RosterDate, b: RosterRule | RosterDate): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}
