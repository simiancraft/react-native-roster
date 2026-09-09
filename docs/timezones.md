# Timezones, columns, and pointer inversion

Three zones take part in a render, and each has one job. The rule or date
timezone interprets local hours in the adapter. The lane timezone is a display
badge only. The view timezone is `windowSpec.timezone`, the component's only
view-zone input; changing it preserves the local anchor, and the padded
expansion envelope usually reuses occurrences for that local week. A new
absolute window requires coverage; a new projection requires geometry. Equal
absolute bounds reuse coverage.

## Roster: elapsed time

The horizontal projection uses true elapsed time, so Chicago's transition weeks
are 167 and 169 hours wide. Rects split at midnight, offset scale boundaries,
and source-set changes. `timeAtX(projection, window, x)` inverts the mapping
with the window supplying the origin. Only pointer results use `snapToStep`.

## Schedule: wall-clock columns

Every day has 24 equal wall-hour bands. Skipped time is empty and fires no
press; repeated time has two half-height regions resolving to different
instants. Each column spans its date's first instant to the next date's first
instant.

Rollbacks across midnight, such as St_Johns in 2009 and Goose_Bay in 1988,
retain that absolute span and compress earlier-date instants into a repeat at
the top edge, ending where ordinary wall time resumes. Pointer inversion
preserves the absolute occurrence. The repeat divider uses the projected
transition instant, including when the surviving repeat regions have unequal
heights.

Skipped wall spans belong to the date they interrupt; its transitions include a
skip at the column's exclusive end when it empties that date's final bands, such
as Nuuk's 23:00 to 24:00 on 2024-03-30. Those bands are hatched and reject
presses. A wholly skipped date has no column; `skippedDateZone` labels the
header gap (Apia, 2011-12-30).

Column x coordinates reset per column; `rect.column` selects it.
`timeAtY(projection, columnIndex, y)` inverts the column mapping and returns
null for skipped time or points outside bounds. Inverse times stay below each
scale piece's exclusive end, including for pointers immediately inside the
bottom edge.

## Implementation notes

Core timezone arithmetic uses `Intl.DateTimeFormat.formatToParts` with explicit
Gregorian and Latin-digit formatting and UTC Date arithmetic. Hourly probes
bracket IANA offset changes, then a binary search locates exact boundaries. Two
offset changes within one probe hour are outside this helper's assumption.
