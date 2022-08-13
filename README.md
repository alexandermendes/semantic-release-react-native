# semantic-release-react-native

[![npm version](https://badge.fury.io/js/semantic-release-react-native.svg)](https://badge.fury.io/js/semantic-release-react-native)

A [Semantic Release](https://github.com/semantic-release/semantic-release) plugin
for versioning [React Native](https://reactnative.dev/) applications.

| Step               | Description                                                            |
|--------------------|------------------------------------------------------------------------|
| `verifyConditions` | Verify that the configuration is valid.                                |
| `publish`          | Update the relevant iOS and Android files with the new version number. |

## Installation

```sh
npm install semantic-release-react-native -D
```

## Usage

The plugin can be configured in the [Semantic Release configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "semantic-release-react-native",
    [
      "@semantic-release/git",
      {
        "assets": [
          "ios/**/Info.plist",
          "ios/**/*.pbxproj",
          "android/app/build.gradle",
        ],
      },
    ],
  ]
}
```

The example configuration above will version and git commit your native files.

## Configuration

| Property               | Description                                               | Default                    |
|------------------------|-----------------------------------------------------------|----------------------------|
| `androidPath`          | Path to your "android/app/build.gradle" file.             | `android/app/build.gradle` |
| `iosPath`              | Path to your "ios/" folder.                               | `ios`                      |
| `skipBuildNumber`      | Do not increment the build number.                        | `false`                    |
| `skipAndroid`          | Skip Android versioning.                                  | `false`                    |
| `skipIos`              | Skip iOS versioning.                                      | `false`                    |
| `iosPackageName`       | Only update iOS projects that have the given name.        | `undefined`                |
| `noPrerelease`         | Strip pre-release labels from versions for both platfoms. | `undefined`                |

## Versioning strategies

By default this plugin will set the `vesionName` for Android and the
`CFBundleShortVersionString` for iOS to the version defined as the next semantic
release.

### Build numbers

For build numbers the differences between the platforms make things a little more
complicated.

#### Android

For Android, the `versionCode` is an integer that must be incremented with every
version of the app that you plan to release. To keep things simple this plugin
auto-increments the current `versionCode` by one for every release. The maximum
value currently allowed by the Google Play Store is 2100000000, so there should
be plenty of room here for even the most productive of developers.

#### iOS

For iOS, there is a lot of conflicting information around what constitutes a
technically correct `CFBundleVersion`. The general consensus seems to be that it
should be a string comprised of three non-negative, period-separated integers.
So, it may seem that using the semantic version here would make sense, except
that [some of Apple's documentation](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364)
mentions that what would be the MINOR and PATCH parts of the semantic version
are limited to two digits, which could be quite restrictive for projects that
do not generate a lot of breaking changes (i.e. `v1.100.1` would be invalid).

So, for the purpose as allowing as many increments as possible and not breaking
Apple's (rather ambiguous) rules this plugin will auto-increment the
`CFBundleVersion` in the format `xxxx.xx.xx`, for example:

- `1000.1.1` > `1000.1.2`
- `1000.1.99` > `1000.2.1`
- `1000.99.99` > `1001.1.1`