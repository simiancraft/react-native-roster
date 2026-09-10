# Recurrence semantics

The `react-native-roster/rrule` adapter expands `RuleSet` rules and dates into
intervals and gaps for one absolute window. This page records the rules the
adapter follows so results stay identical across direct expansion, retained
envelopes, and window navigation. The README covers the consumer view; this is
the reference for anyone reading or changing `src/adapters/rrule`.

## Anchors and phase

Expansion retains the original `dtstart` unless it is exactly local midnight
with interval 1 (or absent) and no COUNT. Such rules may skip whole periods in
plain-date space while preserving the weekly weekday and monthly day, stepping
back past nonexistent dates. All other rules keep the original anchor.

Date-only and local-datetime DTSTART preserve their authored date and time, even
inside a skipped date or hour. Explicit-offset DTSTART remains an instant whose
wall fields and offset come from the rule's zone. The engine iterates those wall
fields in UTC calendar space, so a wholly skipped date cannot become another
weekday.

Every rule enumerates from the period containing DTSTART at the anchor wall time,
aligned to WKST for WEEKLY and day 1 for MONTHLY, so interval phases follow the
DTSTART period rather than the first matching date. Dates before DTSTART are
rejected before COUNT and cap admission. DAILY weekday filters are applied by the
adapter to the authored daily sequence because the engine otherwise re-anchors at
the first matching date. The implicit monthly day is supplied explicitly so a
31st cannot drift through February.

## UNTIL

Date-only UNTIL admits only local dates at or before the authored date, even when
its final hour or the whole date is skipped. Local datetime UNTIL compares plain
date-times at the authored anchor's wall time, without normalizing skipped hours.
Explicit-offset UNTIL compares exact instants, preferring an explicit-offset
DTSTART's offset during repeats and using compatible disambiguation otherwise.
A datetime UNTIL before DTSTART admits nothing.

The engine uses the end of UNTIL's local date as a conservative UTC enumeration
bound; explicit-offset UNTIL uses the end of the following local date, and exact
instant admission is its only UNTIL test. Either bound is clamped to the
corresponding UTC calendar bound of the envelope query. The bound stays
conservative through the wall date after any cross-date rollback at the envelope
end; envelope clipping discards the extra candidates.

## COUNT, BYSETPOS, and caps

The adapter never passes COUNT to the engine. It drops wholly nonexistent dates
before counting existing dates from the original anchor, so a skipped date never
becomes a different weekday or consumes COUNT. The adapter owns BYSETPOS after
every other BYxxx filter, grouping plain dates by day, WKST week, or year-month
before deduplication, UNTIL, COUNT, and cap admission. Positional enumeration
includes complete edge periods, then rejects dates before DTSTART and spans
outside the envelope. Out-of-envelope occurrences consume no cap.

The engine iteration limit is the number of authored periods from the enumeration
anchor through the query bound, so empty candidate periods terminate without an
arbitrary cutoff. Only that exact engine limit error signals completed
enumeration; other failures propagate. Replayed iterator passes stop before
buffering positional candidates. YEARLY is unsupported and rejected by input
validation.

## Validation

Every rule and date is validated even for zero-duration windows. Numeric fields
are bounded (`wkst` and `byweekday` 0 to 6, `bymonth` 1 to 12, `bymonthday` and
`bysetpos` signed ranges, hours `0 <= hourstart < hourend <= 24`). `dtstart`,
`until`, and `date` must be strings of at most 64 characters; a full
offset-and-zone form is under 50, and the bound keeps the offset regex linear on
hostile input.
