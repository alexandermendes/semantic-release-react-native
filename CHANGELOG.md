## [1.8.3](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.8.2...v1.8.3) (2024-01-18)


### Bug Fixes

* allow double backslashes in pbxproj files ([4d196e9](https://github.com/alexandermendes/semantic-release-react-native/commit/4d196e98356c481048e8618ae0313521f6b54371))

## [1.8.2](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.8.1...v1.8.2) (2023-08-14)


### Bug Fixes

* tweak pbxproj double quote replacement ([d19fb90](https://github.com/alexandermendes/semantic-release-react-native/commit/d19fb90d7bdba5e2fb8666af0eee1b64fc23c761))

## [1.8.1](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.8.0...v1.8.1) (2023-08-04)


### Bug Fixes

* strip double quotes from MARKETING_VERSION ([350f3a7](https://github.com/alexandermendes/semantic-release-react-native/commit/350f3a7f8258d7e35ae9482b93c6893222f0e5bd))

# [1.8.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.7.0...v1.8.0) (2022-08-18)


### Features

* leave empty tags in plist files alone ([3ef36e8](https://github.com/alexandermendes/semantic-release-react-native/commit/3ef36e87ac7037d8ce4b2b9b93731f6deb3a7968))

# [1.7.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.6.2...v1.7.0) (2022-08-18)


### Features

* leave current indents alone ([d3d00b9](https://github.com/alexandermendes/semantic-release-react-native/commit/d3d00b96bbcda5e43923894d0944221b1c279abe))

## [1.6.2](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.6.1...v1.6.2) (2022-08-18)


### Bug Fixes

* version native files from prepare rather than publish ([b647445](https://github.com/alexandermendes/semantic-release-react-native/commit/b64744532620c6c1afa17d32c69fd942b991949e))

## [1.6.1](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.6.0...v1.6.1) (2022-08-13)


### Bug Fixes

* add validation for version strategies ([5702b8e](https://github.com/alexandermendes/semantic-release-react-native/commit/5702b8e926fcbe7c652e7011a35b38179db7abc5))

# [1.6.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.5.0...v1.6.0) (2022-08-13)


### Bug Fixes

* only allow pre-releases for ios in strict mode ([0fa4c8d](https://github.com/alexandermendes/semantic-release-react-native/commit/0fa4c8da132f87f650ead8f9afadd17c1e61563b))


### Features

* add ignore pre-release strategy ([0f28cce](https://github.com/alexandermendes/semantic-release-react-native/commit/0f28cce530b2df4fa25cfdfe7f7990ba5def8025))
* skip prereleases entirely if noPrerelease given ([c9dbfcf](https://github.com/alexandermendes/semantic-release-react-native/commit/c9dbfcf6228feb6ae733ca386d7a2d1f9cbe3052))

# [1.5.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.4.1...v1.5.0) (2022-08-13)


### Features

* add ios versioning strategies ([351b94c](https://github.com/alexandermendes/semantic-release-react-native/commit/351b94c6cfb6ec02eff1f1e7ac172739d0acc96a))
* add semantic version strategy for ios ([d74843b](https://github.com/alexandermendes/semantic-release-react-native/commit/d74843bc9eceefdafe156a8c01c526b1ab5ac211))
* implement more android version strategies ([6d7c605](https://github.com/alexandermendes/semantic-release-react-native/commit/6d7c605f1f5f316c3a710870ee40038bdbdc4157))

## [1.4.1](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.4.0...v1.4.1) (2022-08-13)


### Bug Fixes

* do not override any MARKETING_VERSION in Info.plist ([fb40be6](https://github.com/alexandermendes/semantic-release-react-native/commit/fb40be632b14320f541a929194a74ac6c94cbe7c))

# [1.4.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.3.4...v1.4.0) (2022-08-13)


### Bug Fixes

* use iosPackageName to ignore plist updates too ([31c09db](https://github.com/alexandermendes/semantic-release-react-native/commit/31c09db1e26072a77da531ff385a51306ac92d9b))


### Features

* validate remaining plugin config options ([5daaaba](https://github.com/alexandermendes/semantic-release-react-native/commit/5daaaba09f9c86f43bf36d55023064231088cd61))

## [1.3.4](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.3.3...v1.3.4) (2022-08-13)


### Bug Fixes

* bring CURRENT_PROJECT_VERSION and MARKETING_VERSION inline ([eb2ce47](https://github.com/alexandermendes/semantic-release-react-native/commit/eb2ce4799724a467ef36578a447054637957ef2f))
* leave $(CURRENT_PROJECT_VERSION) alone ([1e45d08](https://github.com/alexandermendes/semantic-release-react-native/commit/1e45d086873ab3a9267478b0ac14a3f0b5e5e648))
* start CFBundleVersion from 1.1.1 if it does not exist ([ede25a2](https://github.com/alexandermendes/semantic-release-react-native/commit/ede25a25687b482c1ec8db41716a598aec0d6781))

## [1.3.3](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.3.2...v1.3.3) (2022-08-13)


### Bug Fixes

* logging of new bundle version ([2bcdc64](https://github.com/alexandermendes/semantic-release-react-native/commit/2bcdc642f676dccdd0e553139b09abcd8b3cea28))

## [1.3.2](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.3.1...v1.3.2) (2022-08-13)


### Bug Fixes

* plugin index file ([62e8738](https://github.com/alexandermendes/semantic-release-react-native/commit/62e87382c9d491206cdc8c7d54b358958a43918c))

## [1.3.1](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.3.0...v1.3.1) (2022-08-13)


### Bug Fixes

* plugin setup ([d15327e](https://github.com/alexandermendes/semantic-release-react-native/commit/d15327e4559febea033640a111b5d350cbdc1d57))
* trigger build ([93abcb1](https://github.com/alexandermendes/semantic-release-react-native/commit/93abcb1a70ddd0ee36f687b03eb317c70cb3cddd))

# [1.3.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.2.0...v1.3.0) (2022-08-13)


### Bug Fixes

* do not rely on CURRENT_PROJECT_VERSION existing ([d2ef7fa](https://github.com/alexandermendes/semantic-release-react-native/commit/d2ef7fa190dba860fce23cd5c1ac0ff312397257))
* pre-release strategy ([6fbd54e](https://github.com/alexandermendes/semantic-release-react-native/commit/6fbd54e3921294703435328fcf22c431a7a77ce8))


### Features

* add more robust ios versioning strategy ([655e953](https://github.com/alexandermendes/semantic-release-react-native/commit/655e953f0b860eec7b078a66190c4f5b70acf3dd))
* add pre-release strategy ([e1b806a](https://github.com/alexandermendes/semantic-release-react-native/commit/e1b806a2473d614cd92fe7428ae65b58799dafa6))

# [1.2.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.1.0...v1.2.0) (2022-08-13)


### Features

* add noPrerelease option ([2ad5a27](https://github.com/alexandermendes/semantic-release-react-native/commit/2ad5a271fba5a822e7ce11b6416b4ad5df863be9))

# [1.1.0](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.0.1...v1.1.0) (2022-08-12)


### Features

* add verifyConditions step for paths ([53425c4](https://github.com/alexandermendes/semantic-release-react-native/commit/53425c4fe6294c95650ffb96da770ceae445c59e))

## [1.0.1](https://github.com/alexandermendes/semantic-release-react-native/compare/v1.0.0...v1.0.1) (2022-08-12)


### Bug Fixes

* remove invalid cwd context option ([7ea6586](https://github.com/alexandermendes/semantic-release-react-native/commit/7ea6586dfa0bf2dc398a8167b42dcd27a31360b5))

# 1.0.0 (2022-08-12)


### Features

* add android versioning ([7387134](https://github.com/alexandermendes/semantic-release-react-native/commit/738713469afe8a39a4fcffdd20189c3b3ecc42a8))
* add ios versioning ([8712c31](https://github.com/alexandermendes/semantic-release-react-native/commit/8712c31485748f51d4967229128bbc3e09d9fb45))
* add package boilerplate ([855b4e5](https://github.com/alexandermendes/semantic-release-react-native/commit/855b4e5df94cb0e245ae8c21a84d10eaf526c215))
* add skip android versioning option ([af5e714](https://github.com/alexandermendes/semantic-release-react-native/commit/af5e71432076c662d290875d48ab24b4d31a7d64))
