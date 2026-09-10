# team-roster

The showcase. This feature is about a team roster; its children are members.

- `index.tsx`: `TeamRosterScreen`; host-facing zones default to the parts here
- `use-team-roster.ts`: window, filter, sort, zone, density, and selection
- `layout.tsx`, `header-layout.tsx`, `toolbar-layout.tsx`: row and column strategies
- `members/`: `MemberInspector`, `member.types.ts`, and member-local parts
- `parts/`: title, chips, window controls, member label, header cell, grid
  lines, interval and gap fillers, legend, and the generated-data note
- `utils/`: seeded Faker generation, formatting, and NativeWind tone tables

Styled with the semantic tokens in `demo/global.css`; the route shell owns router contact.
