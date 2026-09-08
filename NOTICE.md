# Notices and attributions

react-native-roster uses the MIT license; see [LICENSE](./LICENSE).

## Planned adapter dependencies

- **rrule-temporal**, ggaabe, MIT: <https://github.com/ggaabe/rrule-temporal>.
  Version 1.5.2 is the reference for the recurrence adapter planned in issue #4.
- **@js-temporal/polyfill**, Temporal polyfill contributors, ISC:
  <https://github.com/js-temporal/temporal-polyfill>. Version 0.5.1 is the reference
  for the adapter's absolute-time conversion.

These dependencies are not bundled or imported by the empty bootstrap modules.
When the adapter ships, they will be reachable only through `./rrule`.

## Rendering peer

- **@legendapp/list**, Legend, MIT: <https://github.com/LegendApp/legend-list>.
  A peer dependency, with 2.0.19 used in development; virtualization is planned in #5.

## Predecessor

[react-big-scheduler](https://github.com/StephenChou1017/react-big-scheduler),
Stephen Chou, is the predecessor this package replaces for the roster read surface.
react-native-roster is an independent implementation, not a fork; no predecessor
source is copied into this package.

Retain upstream licenses when adding third-party source or assets. Add new
attributions here in the same change. References do not imply endorsement.
