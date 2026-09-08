# Precompute, then render geometry

A roster answers a coverage question across many lanes. The amount of data is
bounded by intervals and their overlaps, not by how many visual time slots a
chosen minute step creates. A per-cell callback couples rendering cost to grid
density and makes scrolling responsible for work that the data already determines.

The package puts that work behind content-keyed functions. Adapters produce
absolute intervals and removed gaps with provenance. Coverage is computed for
all lanes before sorting, while geometry is requested only for mounted lanes.
Rendering positions the resulting rects; scrolling moves shared offsets without
updating React state. First visits still compute missing geometry. "Precompute"
means separate the expensive algorithms from drawing, not eagerly lay out every
offscreen lane or promise that every interaction is a cache hit.

## Why intervals, not rules

Rules describe an upstream authoring format. Absolute intervals describe what
is covered. Accepting intervals keeps recurrence, feed parsing, database schemas,
and their dependencies outside the core. A static table and a rule set can use
the same renderer, and a rule edit only invalidates the work its content changes.
Provenance is part of the boundary: source sets split where contributors change,
and a fully removed include still leaves an explainable gap.

A bare window has absolute start and end bounds. Span and resolution belong to
the axis, which interprets a local anchor in the view zone. Rule zones interpret
local authoring time; lane zones only label lanes. This division keeps display
preferences out of occurrence keys and separates coverage from projection.

## Two projections, one contract

Roster uses true elapsed time along a shared horizontal axis. Schedule shows one
lane in day columns with 24 wall-clock hour bands, keeping 09:00 aligned across a
week. DST skips and repeats are explicit geometry regions; a skipped date has no
column. Both projections preserve exact epoch bounds, layering, and sources.
Only pointer results snap to a minute step.

Zone Composer separates consumer chrome from those rules. This feature is about
a roster; its children are lanes. This feature is about a schedule; its children
are days. Hooks derive the data; chassis components compose replaceable zones;
parts consume domain data and final geometry. Gallery routes apply the same
pattern to fixtures, including editable adapter inputs.

## Non-goals

Creation, dragging, resizing, persistence, permissions, and recurrence authoring
belong to consumers. This is not an arbitrary event calendar, a month grid, or a
booking system. Press callbacks expose facts for consumer interactions; they do
not decide business policy. The JSON editor is gallery tooling, not a public
rule-authoring API. Performance claims require measurements with a workload,
machine, date, and commit; neither cache architecture nor browser tests establish
phone frame rates. See [performance evidence](./performance.md).
