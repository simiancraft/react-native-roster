# nativewind entry

Registers `Roster` and `Schedule` with NativeWind's `cssInterop` so each
`xxxClassName` prop resolves into the matching `xxxStyle` chrome region.

- Public subpath: `react-native-roster/nativewind`
- Exports: `Roster`, `Schedule`, `rosterClassNames`, `scheduleClassNames`
- The package's one side-effect module; listed in `sideEffects`
- The only module that imports the optional `nativewind` peer

Class props win over default paint because layouts compose regions with
`regionStyle`, which drops the default when the override carries a class entry.
Fine detail is styled through zones. See the README's NativeWind section.
Tests: `test/package/nativewind-entry.test.ts`.
