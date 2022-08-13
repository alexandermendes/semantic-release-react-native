# semantic-release-react-native

[![npm version](https://badge.fury.io/js/semantic-release-react-native.svg)](https://badge.fury.io/js/semantic-release-react-native)

A [Semantic Release](https://github.com/semantic-release/semantic-release) plugin
for versioning [React Native](https://reactnative.dev/) applications.

| Step               | Description                           |
|--------------------|---------------------------------------|
| `verifyConditions` | Validate configuration.               |
| `publish`          | Version native iOS and Android files. |

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

| Property          | Description                                                        | Default                    |
|-------------------|--------------------------------------------------------------------|----------------------------|
| `androidPath`     | Path to your "android/app/build.gradle" file.                      | `android/app/build.gradle` |
| `iosPath`         | Path to your "ios/" folder.                                        | `ios`                      |
| `skipBuildNumber` | Do not increment the build number for either platform.             | `false`                    |
| `skipAndroid`     | Skip Android versioning.                                           | `false`                    |
| `skipIos`         | Skip iOS versioning.                                               | `false`                    |
| `iosPackageName`  | Only update iOS projects that have the given name.                 | `null`                     |
| `noPrerelease`    | Strip pre-release labels from versions for both platforms.         | `false`                    |
| `versionStrategy` | Specifies the versioning strategies for each platform (see below). | `{"android": "increment", "ios": "strict"}` |

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

**Example**

```json
{
  "plugins": [
    ["semantic-release-react-native", {
      "versionStrategy": {
        "android": { "buildNumber": "semantic" },
        "ios": { "buildNumber": "increment" }
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
`v1.25.3` becomes `012503`, with each number in the semantic release version
converted to two digits and the start of each number padded with zeros as necessary.

The downside to this approach is that it effectively breaks when we hit MINOR
or PATCH versions greater than 99. When we get to version `v1.100.1`, for example,
we would have to make a decision about whether or not we allow three digits, in
which case this becomes `0110001` and will break when we release version `2.0.0`
(as `1010001` > `020000`). Or we could choose to only allow two digits and strip
the first, in which case this will break when we release version `v1.101.1`
(as in both cases the `versionCode` would equal `011001`).

If you think you are unlikely to have 100 MINOR or PATCH versions then go ahead
and use this strategy.

#### `relative-extended`

This is similar to the `semantic` strategy described above, yet with the addition
of the minumum API level as the first two digits, followed by a zero. It also
faces the same downsides as the `semantic` strategy.

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

Note the potential risks around In App Purchases described above.

#### `relative`

This strategy behaves the same as the `relative` strategy for Android.

Again, note the potential risks around In App Purchases described above.

#### `none`

Disable updates of the `CFBundleVersion`.

## Pre-releases

Pre-release versions present to major challenges for Android, but iOS again gets
a little more complicated.

### Android

For Android, it is fine to use pre-release versions such as `1.2.3-beta.1`
as the `vesionName`.

### iOS

For iOS, the `CFBundleShortVersionString`
property [does not support pre-release versions](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-111349),
so this plugin will be strip and pre-release labels from the version set against
this property (e.g. `1.2.3-beta.1` becomes `1.2.3`).

However, the `CFBundleVersion` [does seem to have some provision for specifying
pre-release versions](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364), in that
it allows a character in the set [**abdf**] followed by a number between 1 and 255
to be set as a suffix after the version number.

This plugin makes use of this feature in an attempt to help identify
pre-release versions when you upload your app via App Store Connect. It does
this by taking the first character of your pre-release label and, if that character
is one of those in the allowed character set, uses that as the suffix along with
the pre-release version. If the character is not one of those in the allowed set
we fall back to the letter `f`. For example, if the next bundle version is
`1000.1.1` then:

- `1.2.3-alpha.1` > `1000.1.1a1`
- `1.2.3-beta.3` > `1000.1.1b3`
- `1.2.3-feature.42` > `1000.1.1f42`
- `1.2.3-hello.1` > `1000.1.1f1`

If you want to opt out of this behaviour and strip pre-releases for both
Android and iOS you can use the `noPrerelease` option.

## Xcode project files

To help accommodate projects that use Xcode to manage their versioning this plugin
will update the `CURRENT_PROJECT_VERSION` in the same way as the `CFBundleVersion`
and the `MARKETING_VERSION` in the same was as the `CFBundleShortVersionString`.
If these variables are not present in the first place then nothing will be added.

Whether or not you choose to commit these updates is up to you. If you are not
actually using these variables in your `Info.plist` files then they are probably
redundant anyway.
