# team-roster

The showcase. This feature is about a team roster; its children are members.

- `index.tsx`: `TeamRosterScreen`; host-facing component slots default to the parts here
- `use-team-roster.ts`: window, filter, sort, zone, density, and selection
- `layout.tsx`, `header-layout.tsx`, `toolbar-layout.tsx`: row and column strategies
- `members/`: `MemberInspector`, `member.types.ts`, and member-local parts
- `parts/`: title, chips, window controls, member label, header cell, grid
  lines, layer fillers, legend, and the generated-data note
- `utils/`: seeded Faker generation, formatting, and NativeWind tone tables

Styled with the semantic tokens in `demo/global.css`; the route shell owns router contact.

Host slots with inputs use ComponentType; backZone is a node. Stable interval,
header-cell, and lane-label components read display settings from context.
The member Schedule shares the interval component and timezone context.
