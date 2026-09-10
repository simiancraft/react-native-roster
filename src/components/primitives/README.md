# primitives

Hookless building blocks shared by Roster and Schedule. Nothing here is a
public export.

- `press-point.tsx`, `press-point.web.tsx`, `press-point.types.ts`: pointer
  coordinates relative to the pressed surface; the web file is selected by the
  `browser` remap in package.json
- `region-style.ts`: `regionStyle(structure, paint, override)`, which drops the
  default paint when the override carries a NativeWind class entry

Tests: `test/components/primitives`.
