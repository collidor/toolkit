## [0.3.1](https://github.com/collidor/toolkit/compare/v0.3.0...v0.3.1) (2026-09-26)


### Bug Fixes

* **ci:** sync package-lock.json and bump node-version to 24 for github pages workflow ([60463c1](https://github.com/collidor/toolkit/commit/60463c1bcac7e1b94ce5b9574ccd2cee5a3cec8c))

# [0.3.0](https://github.com/collidor/toolkit/compare/v0.2.3...v0.3.0) (2026-09-26)


### Bug Fixes

* **test:** configure deno test exclusion for demo directory and clean unused imports ([293e300](https://github.com/collidor/toolkit/commit/293e30053eee3700caeb95d907531d8092abe96d))


### Features

* **demo:** add multi-framework pokédex showcase, dynamic unmounting, and github pages deployment ([3a04aa8](https://github.com/collidor/toolkit/commit/3a04aa80d9c0cdb2d87183088528c0947bae4633))

## [0.2.3](https://github.com/collidor/toolkit/compare/v0.2.2...v0.2.3) (2026-09-26)


### Bug Fixes

* **deps:** update collidor dependencies ([b7bd5be](https://github.com/collidor/toolkit/commit/b7bd5bebd28e9c434e0bd6a523292cc20dbb7582))

## [0.2.2](https://github.com/collidor/toolkit/compare/v0.2.1...v0.2.2) (2026-09-24)


### Bug Fixes

* **deps:** update all collidor dependencies to latest ([c173b04](https://github.com/collidor/toolkit/commit/c173b04f1c2297abb9cf61caca9cc5c6112a94d0))
* **deps:** update schema-command dependency range ([5240347](https://github.com/collidor/toolkit/commit/5240347696f56d8eb0aad9326ca2cdb688398dbf))

## [0.2.1](https://github.com/collidor/toolkit/compare/v0.2.0...v0.2.1) (2026-09-24)


### Bug Fixes

* **deps:** update @collidor/event to ^4.4.0 and @collidor/command to ^7.1.0 ([e9e2c27](https://github.com/collidor/toolkit/commit/e9e2c270fbb46c505496239bb3838161465ae9fa))

# [0.2.0](https://github.com/collidor/toolkit/compare/v0.1.7...v0.2.0) (2026-08-17)


### Bug Fixes

* **ci:** add --allow-dirty to jsr publish to ignore uncommitted lockfiles ([3de6db7](https://github.com/collidor/toolkit/commit/3de6db78887a1fbf0b1010f1a489023c60e1fb77))
* **ci:** add dummy NPM_TOKEN to satisfy semantic-release preflight check for OIDC ([47c980c](https://github.com/collidor/toolkit/commit/47c980cb367b9edd04023e2ff3584adddc540d95))
* **ci:** decouple npm and jsr publish from semantic-release ([907ac82](https://github.com/collidor/toolkit/commit/907ac82ff50f8d95b73b8d755d90eb1192345586))
* **ci:** re-enable native semantic-release npm publishing for OIDC ([261d789](https://github.com/collidor/toolkit/commit/261d7898b028872c77cb3366570fc7a16395ae27))
* trigger patch release ([a54ae2f](https://github.com/collidor/toolkit/commit/a54ae2f391ebc2ae9f4a8dccbc3149839f56b81a))


### Features

* **toolkit:** export individual entry points for all re-exported packages ([aeb09a7](https://github.com/collidor/toolkit/commit/aeb09a789eef9ca265e781869d4e29e79ed5fcbb))

# @collidor/command

## 0.1.7

### Patch Changes

- release result
- Updated dependencies
  - @collidor/result@0.1.2

## 0.1.6

### Patch Changes

- Updated dependencies
  - @collidor/result@0.1.1

## 0.1.5

### Patch Changes

- Updated dependencies
  - @collidor/result@0.1.0

## 0.1.4

### Patch Changes

- add extra features to Result
- Updated dependencies
  - @collidor/result@0.0.4

## 0.1.3

### Patch Changes

- Export async commandbus

## 0.1.1

### Patch Changes

- fix imports
- Updated dependencies
  - @collidor/command@7.0.1
  - @collidor/event@4.3.3
  - @collidor/injector@2.4.17
  - @collidor/observable-command@1.0.1
  - @collidor/observable-event@0.0.4
  - @collidor/result@0.0.3
  - @collidor/schema-command@0.1.4

## 0.1.0

### Minor Changes

- Bump underlining commandBus split

## 0.0.15

### Patch Changes

- Y
- Updated dependencies
  - @collidor/observable-command@1.0.0
  - @collidor/command@7.0.0
  - @collidor/schema-command@0.1.3

## 0.0.14

### Patch Changes

- Add observable event
- Updated dependencies
  - @collidor/observable-command@0.0.3
  - @collidor/event@4.3.2
  - @collidor/command@6.0.3
  - @collidor/observable-event@0.0.3
  - @collidor/schema-command@0.1.2

## 0.0.13

### Patch Changes

- Added observable command
- Updated dependencies
  - @collidor/command@6.0.2
  - @collidor/observable-command@0.0.2
  - @collidor/schema-command@0.1.1

## 0.0.12

### Patch Changes

- SchemaCommand now has zod schema for output
- Updated dependencies
  - @collidor/schema-command@0.1.0

## 0.0.11

### Patch Changes

- Create result and fix dependencies sync
- Updated dependencies
  - @collidor/schema-command@0.0.7
  - @collidor/command@6.0.1
  - @collidor/event@4.3.1
  - @collidor/injector@2.4.16
  - @collidor/result@0.0.2

## 0.0.10

### Patch Changes

- Add cleanup callback to event.on return
- Updated dependencies
  - @collidor/event@4.3.0
  - @collidor/command@6.0.0
  - @collidor/schema-command@0.0.6

## 0.0.9

### Patch Changes

- change re-export for nodejs support
- Updated dependencies
  - @collidor/injector@2.4.15

## 0.0.8

### Patch Changes

- update tsup and export injector register type
- Updated dependencies
  - @collidor/schema-command@0.0.5
  - @collidor/command@5.3.15
  - @collidor/injector@2.4.14
  - @collidor/event@4.2.13

## 0.0.7

### Patch Changes

- Re-export injector types

## 0.0.6

### Patch Changes

- Export Inject types
- Updated dependencies
  - @collidor/injector@2.4.13

## 0.0.5

### Patch Changes

- Reupload
- Updated dependencies
  - @collidor/command@5.3.14
  - @collidor/event@4.2.12
  - @collidor/injector@2.4.12
  - @collidor/schema-command@0.0.4

## 0.0.4

### Patch Changes

- Update readme and fix npmrc
- Updated dependencies
  - @collidor/schema-command@0.0.3

## 0.0.3

### Patch Changes

- add schema toolkit
- Updated dependencies
  - @collidor/command@5.3.13
  - @collidor/event@4.2.11
  - @collidor/injector@2.4.11
  - @collidor/schema-command@0.0.2

## 0.0.2

### Patch Changes

- 677ef8f: first package
- 80e351b: add command to toolkit
- Updated dependencies [a8b57a3]
- Updated dependencies [80e351b]
  - @collidor/command@5.3.12

## 5.3.11

### Patch Changes

- publish
- Updated dependencies
  - @collidor/event@4.2.10

## 5.3.10

### Patch Changes

- publish test
- Updated dependencies
  - @collidor/event@4.2.9

## 5.3.9

### Patch Changes

- test publish
- Updated dependencies
  - @collidor/event@4.2.8

## 5.3.8

### Patch Changes

- 09d97fb: publish test
- publish test
- Updated dependencies [09d97fb]
- Updated dependencies
  - @collidor/event@4.2.7

## 5.3.7

### Patch Changes

- 17c8fc2: publish test
- publish
- Updated dependencies [17c8fc2]
- Updated dependencies
- Updated dependencies [17c8fc2]
  - @collidor/event@4.2.6

## 5.3.6

### Patch Changes

- publish
- Updated dependencies
  - @collidor/event@4.2.5

## 5.3.5

### Patch Changes

- 750cba9: publish
- Updated dependencies [750cba9]
  - @collidor/event@4.2.4

## 5.3.4

### Patch Changes

- publish
- Updated dependencies
  - @collidor/event@4.2.3

## 5.3.3

### Patch Changes

- publish
- 9f45da4: publish
- Updated dependencies
- Updated dependencies [9f45da4]
  - @collidor/event@4.2.2
