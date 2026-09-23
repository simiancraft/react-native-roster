## [1.0.0](https://github.com/simiancraft/react-native-roster/compare/v0.5.1...v1.0.0) (2026-09-23)

### ⚠ BREAKING CHANGES

* **schedule:** omitted Schedule now no longer starts or updates a system clock.

### Features

* **schedule:** implement controlled-now library contract ([adf9975](https://github.com/simiancraft/react-native-roster/commit/adf99759e47f8946cd6bafdfa813e2bf12a6a297))

### Bug Fixes

* **demo:** derive time-off presentation from provenance ([964c861](https://github.com/simiancraft/react-native-roster/commit/964c861a03acf18cb9c92e8bc44c0f2c49215dda))
* **demo:** make short dates and reset labels explicit ([e1a7e0e](https://github.com/simiancraft/react-native-roster/commit/e1a7e0ee0f576c74260a3ed2863ef8650737ee36))

## [0.5.1](https://github.com/simiancraft/react-native-roster/compare/v0.5.0...v0.5.1) (2026-09-22)

# [0.5.0](https://github.com/simiancraft/react-native-roster/compare/v0.4.17...v0.5.0) (2026-09-22)


### Features

* **render:** expose the Roster incomplete component slot ([276bbe1](https://github.com/simiancraft/react-native-roster/commit/276bbe19f3da83db54137b322f0b19de2dad3816))

## [0.4.17](https://github.com/simiancraft/react-native-roster/compare/v0.4.16...v0.4.17) (2026-09-22)


### Bug Fixes

* **demo:** classify authored wall-time outcomes ([db16d4a](https://github.com/simiancraft/react-native-roster/commit/db16d4a9a125ad4a0f38bfdaea9dedc2b1556322))
* **demo:** keep week day boundaries legible ([f3edc27](https://github.com/simiancraft/react-native-roster/commit/f3edc27d8c7a7814f7664adc48620a6782b6aca6))
* **demo:** repeat date context across week ticks ([fa2b82d](https://github.com/simiancraft/react-native-roster/commit/fa2b82d43ab2bc1720d1b1696d52964a4e590542))
* **schedule:** preserve transition fragment ([31fbf13](https://github.com/simiancraft/react-native-roster/commit/31fbf13944b090ca6bb4d3e6ac12fd3ca54f3a4a))

## [0.4.16](https://github.com/simiancraft/react-native-roster/compare/v0.4.15...v0.4.16) (2026-09-22)


### Bug Fixes

* **render:** scroll lanes from wheel input over the label column ([0b2fb50](https://github.com/simiancraft/react-native-roster/commit/0b2fb50358f721dfc7bb4d807a547bce19bf61df))


### Features

* **demo:** navigate the roster from inspector day presses ([6a741b7](https://github.com/simiancraft/react-native-roster/commit/6a741b7179a7a77590029d24d0133a5f9f448cc2))

## [0.4.15](https://github.com/simiancraft/react-native-roster/compare/v0.4.14...v0.4.15) (2026-09-21)


### Bug Fixes

* **core:** bound calendar and zone caches ([2134a6b](https://github.com/simiancraft/react-native-roster/commit/2134a6bd8c068d958a37b28ada4f26027f00fb02))

## [0.4.14](https://github.com/simiancraft/react-native-roster/compare/v0.4.13...v0.4.14) (2026-09-21)


### Bug Fixes

* **render:** bound and register layer style cache ([3f51ac2](https://github.com/simiancraft/react-native-roster/commit/3f51ac23e05db6685a1afff424e8e53ccbf26400))

## [0.4.13](https://github.com/simiancraft/react-native-roster/compare/v0.4.12...v0.4.13) (2026-09-21)


### Bug Fixes

* **rrule:** register caches for complete clearing ([340c4d4](https://github.com/simiancraft/react-native-roster/commit/340c4d47a59178e3e768017791c1e851d7e12497))

## [0.4.12](https://github.com/simiancraft/react-native-roster/compare/v0.4.11...v0.4.12) (2026-09-21)


### Bug Fixes

* **roster:** bound and register tick cache ([043a15e](https://github.com/simiancraft/react-native-roster/commit/043a15e7894c89edc7b8ff6be1f1db6b6fa158a1))

## [0.4.11](https://github.com/simiancraft/react-native-roster/compare/v0.4.10...v0.4.11) (2026-09-21)


### Bug Fixes

* **core:** bound geometry caches ([5f7dd08](https://github.com/simiancraft/react-native-roster/commit/5f7dd08a2401133afa6d5a8ce98c8587f9512204))

## [0.4.10](https://github.com/simiancraft/react-native-roster/compare/v0.4.9...v0.4.10) (2026-09-21)


### Bug Fixes

* **demo:** route library exports to source ([58a0736](https://github.com/simiancraft/react-native-roster/commit/58a07364593f0efca768ac96507b1e9beef86965))

## [0.4.9](https://github.com/simiancraft/react-native-roster/compare/v0.4.8...v0.4.9) (2026-09-21)


### Bug Fixes

* **schedule:** isolate cache ownership by dataset ([2fa0a83](https://github.com/simiancraft/react-native-roster/commit/2fa0a83eff633763c412c90c6c804ea5fedab0e6))

## [0.4.8](https://github.com/simiancraft/react-native-roster/compare/v0.4.7...v0.4.8) (2026-09-21)


### Bug Fixes

* **roster:** isolate cache ownership by dataset ([7c18406](https://github.com/simiancraft/react-native-roster/commit/7c184065f313eb282811280230fdb2c7d82fbdc8))

## [0.4.7](https://github.com/simiancraft/react-native-roster/compare/v0.4.6...v0.4.7) (2026-09-21)


### Bug Fixes

* **core:** scope geometry and coverage caches ([76ec106](https://github.com/simiancraft/react-native-roster/commit/76ec106fc5c4ef5c6a933131c9300689ac97cc5a))


### Features

* **demo:** add a site footer to every demo page ([7a7d33a](https://github.com/simiancraft/react-native-roster/commit/7a7d33a65636521cde5f36a0f1c4bc4f957aff3e))


### Performance Improvements

* **core:** reduce scoped cache key work ([b4d4bc2](https://github.com/simiancraft/react-native-roster/commit/b4d4bc2eab9b2383871ca76682727b6af11ed13a))

## [0.4.6](https://github.com/simiancraft/react-native-roster/compare/v0.4.5...v0.4.6) (2026-09-21)

## [0.4.5](https://github.com/simiancraft/react-native-roster/compare/v0.4.4...v0.4.5) (2026-09-20)


### Bug Fixes

* **demo:** caption chip groups as fieldset legends ([628c940](https://github.com/simiancraft/react-native-roster/commit/628c940d37a463e5b06e13b553e20bb52752a28e))
* **demo:** drop the span caption from the showcase controls ([469d1c2](https://github.com/simiancraft/react-native-roster/commit/469d1c2fae94ad88b9f1ef9324123be2fb9e8188))

## [0.4.4](https://github.com/simiancraft/react-native-roster/compare/v0.4.3...v0.4.4) (2026-09-20)


### Bug Fixes

* **render:** keep translated labels aligned on focus ([07e02d8](https://github.com/simiancraft/react-native-roster/commit/07e02d8c2d80362526a463e3767c864a346d83cb))

## [0.4.3](https://github.com/simiancraft/react-native-roster/compare/v0.4.2...v0.4.3) (2026-09-20)


### Bug Fixes

* **render:** pass dependency arrays to useAnimatedStyle ([7577aee](https://github.com/simiancraft/react-native-roster/commit/7577aee4c87582c178a9c90e4de982c513d3c825))

## [0.4.2](https://github.com/simiancraft/react-native-roster/compare/v0.4.1...v0.4.2) (2026-09-20)

## [0.4.1](https://github.com/simiancraft/react-native-roster/compare/v0.4.0...v0.4.1) (2026-09-19)

# [0.4.0](https://github.com/simiancraft/react-native-roster/compare/v0.3.0...v0.4.0) (2026-09-17)


### Bug Fixes

* **demo:** correct attendance facts, zones, and organization in the showcase ([086de50](https://github.com/simiancraft/react-native-roster/commit/086de50bab1869922a7baba561bb9f07e6b27532))
* **demo:** harden time-off lookup and align the inspector clock ([e026635](https://github.com/simiancraft/react-native-roster/commit/e026635c9fabf3465026a13198273c2271c2cc16))
* **demo:** keep a focused attendance row active through hover changes ([5d0dd86](https://github.com/simiancraft/react-native-roster/commit/5d0dd86917605602127fcec49527049165b6fe44))
* **demo:** keep fixture lanes cached when the gallery expands a rule set ([44e43f4](https://github.com/simiancraft/react-native-roster/commit/44e43f410f89b952f5d2c46d8e20d9f6e2957a8f))
* **demo:** separate interval and gap selection in the showcase inspector ([43c1238](https://github.com/simiancraft/react-native-roster/commit/43c12381fd6b981bd3a9ca1835b1fa71557282b3))


### Features

* **demo:** add scheduled versus actual attendance to the showcase ([70a3811](https://github.com/simiancraft/react-native-roster/commit/70a3811e7079f5a73ae8c481f5b02c3256287036))
* **demo:** redesign the event detail as one shared attendance grid ([682e09e](https://github.com/simiancraft/react-native-roster/commit/682e09e168a65158edfbafae131ee2a439226651))
* **render:** add a now line to the roster body ([a50fb36](https://github.com/simiancraft/react-native-roster/commit/a50fb3689f5be18992fc04b2efcee6922b5082bc))

# [0.3.0](https://github.com/simiancraft/react-native-roster/compare/v0.2.0...v0.3.0) (2026-09-16)


### Features

* **core:** add spanOf and intersectionOf interval helpers ([d845e9d](https://github.com/simiancraft/react-native-roster/commit/d845e9d2c77b411aa6643953f39b770964d50822))
* **core:** add unionOf for merging overlapping and touching spans ([f10d47d](https://github.com/simiancraft/react-native-roster/commit/f10d47d7351390980b10b795b95a4809b99e2e0f))

# [0.2.0](https://github.com/simiancraft/react-native-roster/compare/v0.1.0...v0.2.0) (2026-09-16)


### Bug Fixes

* **render:** anchor selection to the inset rect and keep details visible ([f4c7cc9](https://github.com/simiancraft/react-native-roster/commit/f4c7cc97a4cf6cc25bfc4178639b9b51c08bce17))
* **render:** dismiss the selection on cell and gap presses ([d72f09d](https://github.com/simiancraft/react-native-roster/commit/d72f09d6fd3fc717d9214e13ea6885652fc4a12e))
* **render:** keep selectable off Roster props ([90ccc73](https://github.com/simiancraft/react-native-roster/commit/90ccc7327c5c43c2714536cd18b4813f8e71bae7))
* **render:** let body presses reach the hook while a selection is open ([bbab084](https://github.com/simiancraft/react-native-roster/commit/bbab0847f66af7e5b18ce81316d8151bf3e26a6c))
* **render:** reconcile selection by provenance and bound the popover size ([89b138f](https://github.com/simiancraft/react-native-roster/commit/89b138f7c60172fe8f4d750c203720b2f87c8e9e))
* **render:** restore web scroll and keyboard focus around the selection ([f72462e](https://github.com/simiancraft/react-native-roster/commit/f72462e52d926ffddebaab048fa121993d3ad4fe))


### Features

* **render:** add interval selection with a polymorphic selection layout ([00a4f02](https://github.com/simiancraft/react-native-roster/commit/00a4f027c17b39a2d3335297f0fa5dab52854bd9))

# [0.1.0](https://github.com/simiancraft/react-native-roster/compare/v0.0.1...v0.1.0) (2026-09-16)


### Features

* **render:** accept slot components instead of render functions ([e4b8094](https://github.com/simiancraft/react-native-roster/commit/e4b80940eea81796612b4dc230c39dfc76022e52))

## [0.0.1](https://github.com/simiancraft/react-native-roster/compare/v0.0.0...v0.0.1) (2026-09-14)


### Bug Fixes

* **rrule:** add resolution-mode to the temporal-spec type import ([68ada02](https://github.com/simiancraft/react-native-roster/commit/68ada0227b60d07f2fad50ad1a54ab37d62b7ca6))
* **rrule:** type the occurrence adapter against temporal-spec ([d933683](https://github.com/simiancraft/react-native-roster/commit/d933683bba766ed0e0b07c96d5d49d4760ae5a6d))

# Changelog
