# Changelog

### [2.1.1](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v2.1.0...v2.1.1) (2022-07-11)


### Bug Fixes

* move Amagaki to devDependencies ([45cddf3](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/45cddf32d58335acca752cabf05247c866a0ff2b))

## [2.1.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v2.0.1...v2.1.0) (2022-05-13)


### Features

* add ability to trigger builds on content edit ([cc03832](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/cc03832ed56e77eaa4150df80af417989839f8b5))

### [2.0.1](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v2.0.0...v2.0.1) (2022-03-01)


### Bug Fixes

* scoping issue with cloud function ([06741bd](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/06741bd850ac4d8971757123f6bad882767cc4a9))

## [2.0.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.8.1...v2.0.0) (2022-03-01)


### ⚠ BREAKING CHANGES

* add webhook simulator

### Features

* add webhook simulator ([b539ec9](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/b539ec90038d288083509875a2e6903b2ebb57e0))

### [1.8.1](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.8.0...v1.8.1) (2022-01-17)


### Bug Fixes

* verbose output ([12b6b9f](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/12b6b9fd30bf2327ace8683b32640c7ef266ccab))

## [1.8.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.7.0...v1.8.0) (2022-01-10)


### Features

* add bind collection ([38ed436](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/38ed43658d4f92c72be1997ce1d9e88a59e1a008))

## [1.7.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.6.1...v1.7.0) (2021-12-01)


### Features

* paginate listDocumentSummaries ([ae82a3d](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/ae82a3d9d299a8b1751e8669b0df3ba271cc43ef))

### [1.6.1](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.6.0...v1.6.1) (2021-09-12)


### Miscellaneous Chores

* release 1.6.1 ([3590adb](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/3590adb29fbe7bc4b5802b4249b01004b5b4c570))

## [1.6.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.5.1...v1.6.0) (2021-09-10)


### Features

* support using schema to indicate translatable fields ([91c504b](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/91c504b091495d0e2e25d8c41eaa5d8d705c30cf))


### Bug Fixes

* issue with multiple concurrent clients ([f09cb77](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/f09cb77cceb6768cf3bc211ef5071f4fa47b649a))
* throttle collection requests ([63c94d8](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/63c94d8b861532a85491f8351a8f5244f5fadf3c))
* use listDocumentSummaries to avoid server-side depth issue ([d28a1a6](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/d28a1a6d1851865a95b189f03aa032da3c320c46))

### [1.5.1](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.5.0...v1.5.1) (2021-06-28)


### Bug Fixes

* limit concurrent requests ([fbf41ee](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/fbf41eeec19e84cf7d51585802838f8cc0efd9f2))

## [1.5.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.4.0...v1.5.0) (2021-06-28)


### Features

* allow limiting collections on translation import ([3c5d9a0](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/3c5d9a0f4e509784f41b74f673aa8fc2c9b5aff4))

## [1.4.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.3.0...v1.4.0) (2021-06-25)


### Features

* add ability to download non-string data ([774f686](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/774f686fd2d219219b898247b46a415c4f776e9d))
* use cached discovery document to reduce requests ([c90fda5](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/c90fda5ccf4492ffb52ef1b06d886000351d6dc5))

## [1.3.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.2.0...v1.3.0) (2021-06-17)


### Features

* allow adding fields to routes ([c8a89bc](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/c8a89bc30a0ddf47e5b749082fb4c7578ed515c3))
* export more objects ([4648ca4](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/4648ca4f01bde2498fdb6a5a0e14fd6c1e1dbe0a))

## [1.2.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.1.0...v1.2.0) (2021-06-17)


### Features

* export utils to index ([277cf86](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/277cf8607a5f8aae5a529aba701e23fdecbe89cc))

## [1.1.0](https://www.github.com/blinkk/amagaki-plugin-kintaro/compare/v1.0.0...v1.1.0) (2021-06-14)


### Features

* add ?flush support to reset cache ([a7020d4](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/a7020d47adea1da5d701bc9ca4755a0692437e6d))
* add kintaro route provider ([4fa7acf](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/4fa7acf8abf909aa43cfdf9d2ffe277316fcb27a))
* import many documents ([ffc400c](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/ffc400c84f284c8ab4b698afdb217fa2bdcbb0de))


### Bug Fixes

* resolve deep documents ([e1342fe](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/e1342fe0218246ee5c1465368c958da5649b31c1))

## 1.0.0 (2021-06-13)


### Features

* add kintaro route provider ([4fa7acf](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/4fa7acf8abf909aa43cfdf9d2ffe277316fcb27a))
* import many documents ([ffc400c](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/ffc400c84f284c8ab4b698afdb217fa2bdcbb0de))


### Bug Fixes

* resolve deep documents ([e1342fe](https://www.github.com/blinkk/amagaki-plugin-kintaro/commit/e1342fe0218246ee5c1465368c958da5649b31c1))
