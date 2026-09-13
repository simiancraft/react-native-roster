# primitives

Building blocks shared by the projections, plus the native portal store for Roster selection.

- `press-point.tsx`, `press-point.web.tsx`, `press-point.types.ts`: pointer
  coordinates relative to the pressed surface; the web file is selected by the
  `browser` remap in package.json
- `region-style.ts`: `regionStyle(structure, paint, override)`, which drops the
  default paint when the override carries a NativeWind class entry

Tests: `test/components/primitives`.

- `portal.tsx`: root-exported `PortalHost({name})` and
  `Portal({hostName,name,children})`; a module-level Map of hosts to portal nodes,
  subscribed through useSyncExternalStore, registered and removed through lifecycle effects

Mount one host per destination name. The default Roster selection layout owns its
per-instance host; custom layouts can target an ancestor host they own. Caller
context does not cross the store; provide it above the host or inside the node.
Schedule does not yet support selection.
