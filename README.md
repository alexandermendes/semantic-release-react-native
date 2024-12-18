# semantic-release-react-native

[![npm version](https://badge.fury.io/js/semantic-release-react-native.svg)](https://badge.fury.io/js/semantic-release-react-native)

A [Semantic Release](https://github.com/semantic-release/semantic-release) plugin
for versioning [React Native](https://reactnative.dev/) applications.

| Step               | Description                           |
|--------------------|---------------------------------------|
| `verifyConditions` | Validate configuration.               |
| `prepare`          | Version native iOS and Android files. |

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

| Property          | Description                                                                    | Default                    |
|-------------------|--------------------------------------------------------------------------------|----------------------------|
| `androidPath`     | Path to your "android/app/build.gradle" file.                                  | `android/app/build.gradle` |
| `iosPath`         | Path to your "ios/" folder.                                                    | `ios`                      |
| `skipBuildNumber` | Do not increment the build number for either platform.                         | `false`                    |
| `skipAndroid`     | Skip Android versioning.                                                       | `false`                    |
| `skipIos`         | Skip iOS versioning.                                                           | `false`                    |
| `iosPackageName`  | Only update iOS projects that have the given name.                             | `null`                     |
| `noPrerelease`    | Skip pre-release versions entirely for both platforms.                         | `false`                    |
| `fromFile`        | Use a JSON file (e.g. `.versionrc.json`) to read and write the version number. | `null`                     |
| `versionStrategy` | Specifies the versioning strategies for each platform (see below).             | `{"android": {"buildNumber": "increment", "preRelease": true}, "ios": {"buildNumber": "strict", "preRelease": true}}` |

## Versioning strategies

By default this plugin will set the `vesionName` for Android and the
`CFBundleShortVersionString` for iOS to the version defined as the next semantic
release.

Setting the `vesionCode` for Android and the `CFBundleVersion` for iOS becomes
a little more complicated due to differences between how the platforms use these
properties.

This plugin uses sensible defaults for each platform. However, these defaults may
not work for you if introducing this plugin to a project that was already
versioned in an entirely different way, or if you just have a different personal
preference. In order to provide suitable flexibility various alternative
strategies are available for each platform.

**Example (defaults shown)**

```json
{
  "plugins": [
    ["semantic-release-react-native", {
      "versionStrategy": {
        "android": { "buildNumber": "increment" },
        "ios": { "buildNumber": "strict" }
      }
    }],
  ]
}
```

### Android

For Android, the `versionCode` is an integer that must be incremented in some
way with every version of the app. The maximum value currently allowed by the
Google Play Store is 2100000000. The available strategies for achieving this
are described below.

#### `increment`

This is the default strategy for this platform.

It auto-increments the current `versionCode` by one for every release.

#### `relative`

Update the `versionCode` in-line with the next semantic version. For example,
`v1.25.3` becomes `12503`, with each number in the semantic release version
converted to two digits and the start of each number padded with zeros as necessary.
Any leading zeros are then stripped to avoid Android encoding as an octal number.

The downside to this approach is that it effectively breaks when we hit MINOR
or PATCH versions greater than 99. When we get to version `v1.100.1`, for example,
we would have to make a decision about whether or not we allow three digits, in
which case this becomes `110001` and will break when we release version `2.0.0`
(as `1010001` > `20000`). Or we could choose to only allow two digits and strip
the last, in which case this will break when we release version `v1.101.1`
(as in both cases the `versionCode` would equal `11001`).

If you think you are unlikely to have 100 MINOR or PATCH versions then go ahead
and use this strategy.

#### `relative-extended`

This is similar to the `semantic` strategy described above, yet with the addition
of the minumum API level as the first two digits, followed by a zero. It also
faces the same downsides as the `semantic` strategy.

#### `env`

Read `versionCode` from environment variable `ANDROID_BUILD_NUMBER`.

#### `none`

Disable updates of the `versionCode`.

### iOS

The strategies for iOS are perhaps even more confusing due to the amount of
conflicting information out there about what constitutes a technically correct
`CFBundleVersion`, with Apple's own documentation suggesting different
restrictions in different places.

The general consensus seems to be that it should be a string comprised of three
non-negative, period-separated integers. There also seem to be plenty of projects
that have used just a single integer, apparently without issue. However, just
because these projects haven't encountered issues it doesn't mean they never will.
For example, [the documentation](https://developer.apple.com/library/archive/technotes/tn2413/_index.html#//apple_ref/doc/uid/DTS40016228-CH1-TROUBLESHOOTING-CALLING_THE_PAYMENT_QUEUE___S_RESTORECOMPLETEDTRANSACTIONS_METHOD_DOES_NOT_RESTORE_ANY_PRODUCTS_IN_MY_APPLICATION) states that it may be impossible to restore
In App Purchases if the `CFBundleVersion` does not follow [the guidelines](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364) for build numbers.

With all that said, the available strategies are described below.

#### `strict`

This is the default strategy for this platform.

It aims to comply fully with [Apple's `CFBundleVersion` documentation](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364), which states that the version number should be a string comprised
of three non-negative, period-separated integers.

So, it may seem that using the semantic version here would make sense. However,
there are additional restrictions applied to this version number in that the
second and third digits can only be two digits long. This could be quite
restrictive for projects that do not generate a lot of breaking changes
(i.e. `v1.100.1` would be invalid).

Therefore, in order to allow as many increments as possible during the lifecycle
of a project this strategy will auto-increment the `CFBundleVersion` in the
format `xxxx.xx.xx`, for example:

- `1000.1.1` > `1000.1.2`
- `1000.1.99` > `1000.2.1`
- `1000.99.99` > `1001.1.1`

Note that if your current `CFBundleVersion` is already greater that 9999 then
according to the documentation above it is already invalid, as the documentation
also states that the first number can only be four digits long. So, in this case
we will just keep incrementing it following the pattern described above and
hopefully Apple won't complain!

#### `increment`

This strategy behaves the same as the `increment` strategy for Android.

#### `relative`

This strategy behaves the same as the `relative` strategy for Android.

#### `semantic`

Use the semantic version number directly.

#### `env`

Use the version from environment variable `IOS_BUILD_NUMBER`.

#### `none`

Disable updates of the `CFBundleVersion`.

## Pre-releases

Pre-release versions present no major challenges for Android, but iOS again gets
a little more complicated. We provide a versioning strategy that will work for
each platform, or you can choose to ignore pre-releases entirely for a particular
platform by setting `versionStrategy.<platform>.preRelease` to `false`.

**Example (defaults shown)**

```json
{
  "plugins": [
    ["semantic-release-react-native", {
      "versionStrategy": {
        "android": { "preRelease": true },
        "ios": { "preRelease": true }
      }
    }],
  ]
}
```

### Android

For Android, it is fine to use pre-release versions such as `1.2.3-beta.1`
as the `vesionName`, so this is what we do.

### iOS

For iOS, the [`CFBundleShortVersionString`](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring) and [`CFBundleVersion`](https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleversion) do not support pre-release versions.

To get around this limitation for pre-releases we generate a patch version by multiplying
the current patch by 10,000 and adding the pre-release version. For example, if the
current version is `1.1.1` and the next release version is `1.2.2-beta.42`
resulting iOS version and build number will be `1.1.20042`. This should help
avoid clashes that may otherwise happen if you are pushing pre-releases to TestFlight.

Note that this feature only works when using the `strict` versioning strategy
for iOS (which is the default).

## Xcode project files

To help accommodate projects that use Xcode to manage their versioning this plugin
will update the `CURRENT_PROJECT_VERSION` in the same way as the `CFBundleVersion`
and the `MARKETING_VERSION` in the same was as the `CFBundleShortVersionString`.
If these variables are not present in the first place then nothing will be added.

Whether or not you choose to commit these updates is up to you. If you are not
actually using these variables in your `Info.plist` files then they are probably
redundant anyway.

## Build version file

If you do not want to update the `Info.plist` and `build.gradle` files directly you
can read and write the build version to a JSON file instead, using the `fromFile` option.
This can be useful for supporting Expo projects, where this version file can then be loaded
into your [app config](https://docs.expo.dev/workflow/configuration/).

The file will be output in the following format:

```json
{
  "android": 5322,
  "ios": "3837.15.99"
}
```

The example below configures the `semantic-release-react-native` plugin to write the
build numbers to the `versionrc.json` file, then commits this using the
[`@semantic-release/git`](https://github.com/semantic-release/git) plugin.

```json
{
  "plugins": [
    ["semantic-release-react-native", {
      "fromFile": ".versionrc.json",
    }],
    ["@semantic-release/git", {
      "assets": [".versionrc.json"],
    }],
  ]
}
```
