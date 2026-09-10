# rrule adapter

The shipped adapter. It converts a `RuleSet` of RFC 5545 rules and dated
overrides into absolute intervals and gaps for one window, with exact
provenance per span.

- Public subpath: `react-native-roster/rrule`
- Exports: `expandRuleSet`, `envelopeFor`, `clearExpandCache`, `expandStats`,
  `resetExpandStats`, and the `RosterRule`, `RosterDate`, `RuleSet`,
  `ExpandOptions`, `ExpandResult`, and `ExpandStats` types
- Imports: `../../core` only; never components or another adapter
- Owns: `rrule-temporal` and the Temporal polyfill; root and core never load them

## Supported input

`RosterRule` covers DAILY, WEEKLY, and MONTHLY with `interval`, `count`,
`until`, `wkst`, `byweekday`, `bymonth`, `bymonthday`, and `bysetpos`, plus
`hourstart`, `hourend`, and an IANA `timezone`. `RosterDate` is a single local
date, whole day or with hours. Both are `include` or `exclude`. YEARLY and
unbounded strings are rejected by validation.

## File map

| File | Role |
| --- | --- |
| `index.ts` | the entry point; the only barrel |
| `types.ts` | input and result types |
| `validate.ts` | input rejection before any engine work |
| `envelope.ts` | widens a window to whole local days per rule zone |
| `occurrences.ts` | drives the engine and applies every calendar correction |
| `net.ts` | nets includes against excludes into intervals and gaps |
| `cache.ts`, `hash.ts` | retained occurrences and envelopes keyed by content |
| `expand.ts` | the orchestrator: validate, envelope, expand, cap, net, attach |

## Reference

- [Recurrence semantics](../../../docs/recurrence.md): the rules `occurrences.ts` follows
- [Caches](../../../docs/caches.md): retention, keys, and counters
- [Adapters guide](../../../docs/adapters.md): the consumer view for any upstream shape
- [Adding an adapter](../../../docs/adding-an-adapter.md): the contributor recipe
- Tests: `test/adapters/rrule`
