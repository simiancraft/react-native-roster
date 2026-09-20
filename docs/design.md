# Precompute, then render geometry

A week at a 15-minute step is 672 cells per lane. For 200 lanes, a component
that calls back per cell makes 134,400 calls to draw one screen's worth of data,
and finer ticks make it worse. The same week in this package's benchmark
workload is 70 rects per lane: 63 intervals and 7 gaps. Roster draws the rects.
Tick density changes the grid lines and nothing else.

The work is split by who needs it. Coverage runs for every lane, because sorting
by coverage needs all of them. Geometry runs for the lanes the list has mounted
(24 in the benchmark viewport), plus the selected lane so its detail stays
anchored. Scrolling moves shared offsets and never sets React state. The first
time a lane mounts for a window, its geometry is computed and cached; after
that it is a lookup. The cache key is the lane's layer content, or a `version`
you supply; if you supply one, change it when the layers change.

## Accept intervals at the boundary

The renderer takes absolute intervals, so a database table and a recurrence
rule can feed the same component. Adapters own the upstream format. The rrule
adapter owns rule expansion and its two dependencies, and nothing in the core
imports them.

Sources travel with the time they produced. Where the set of contributing
sources changes, the rect splits, so overlapping contributions stay
distinguishable when pressed. Removing an include entirely still leaves a gap
that carries the sources of the exclusion, so "why is nobody on Wednesday" has
an answer.

A window is two absolute bounds and nothing more. The axis picks those bounds
from a local anchor date and the view timezone. The rule timezone interprets
authored local hours. A lane's own timezone is a label and leaves its intervals
alone. Coverage uses absolute bounds, so changing the projection reuses it.

## Project the same intervals two ways

Roster puts lanes on an elapsed-time axis, so width is real duration. The weeks
containing Chicago's 2024 transitions are 167 and 169 hours wide.

Schedule puts one lane into day columns with 24 wall-clock hour bands, so an
ordinary 09:00 lines up across the week. A skipped hour stays empty and hatched.
A repeated hour fits both occurrences into its band. A date that is skipped
whole gets a header marker and no column. Pressing empty space snaps to the
minute step; intervals and gaps keep their exact bounds.

Both components are built with
[Zone Composer](https://github.com/simiancraft/simiancraft-skills/blob/main/skills/zone-composer/SKILL.md),
a composition pattern: a hook owns state and derived data, a chassis component
branches on status and fills named zones, and replaceable parts receive domain
data and final geometry. For a consumer that means every region of Roster and
Schedule can be replaced without forking layout or hit testing.

## Non-goals

- Creating, dragging, and resizing intervals belong to your app.
- So do persistence, permissions, and business policy; press callbacks report
  facts and decide nothing.
- Authoring recurrence rules belongs to your tooling. The JSON editor in the
  gallery is a demo, not an API.
- There is no month grid.

A performance claim needs a workload, a machine, a date, and a commit, and a
phone frame rate needs a phone. See [performance evidence](./performance.md).
