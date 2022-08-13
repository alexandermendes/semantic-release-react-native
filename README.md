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

| Property               | Description                                                | Default                    |
|------------------------|------------------------------------------------------------|----------------------------|
| `androidPath`          | Path to your "android/app/build.gradle" file.              | `android/app/build.gradle` |
| `iosPath`              | Path to your "ios/" folder.                                | `ios`                      |
| `skipBuildNumber`      | Do not increment the build number.                         | `false`                    |
| `skipAndroid`          | Skip Android versioning.                                   | `false`                    |
| `skipIos`              | Skip iOS versioning.                                       | `false`                    |
| `iosPackageName`       | Only update iOS projects that have the given name.         | `null`                     |
| `noPrerelease`         | Strip pre-release labels from versions for both platforms. | `false`                    |

## Versioning strategies

By default this plugin will set the `vesionName` for Android and the
`CFBundleShortVersionString` for iOS to the version defined as the next semantic
release.

### Build numbers

For build numbers the differences between the platforms make things a little more
complicated.

#### Android

For Android, the `versionCode` is an integer that must be incremented in some way
with every version of the app. To keep things simple this plugin auto-increments
the current `versionCode` by one for every release. The maximum value currently
allowed by the Google Play Store is 2100000000, so there should
be plenty of room here for even the most productive of developers.

#### iOS

For iOS, there is a lot of conflicting information out there around what
constitutes a technically correct `CFBundleVersion`. The general consensus seems
to be that it should be a string comprised of three non-negative, period-separated
integers. So, it may seem that using the semantic version here would make sense,
except that [some of Apple's documentation](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364)
mentions that what would be the MINOR and PATCH parts of the semantic version
are limited to two digits, which could be quite restrictive for projects that
do not generate a lot of breaking changes (i.e. `v1.100.1` would be invalid).

So, in order to allow as many increments as possible during the lifecycle of an
app and not breaking Apple's (rather ambiguous) rules this plugin will
auto-increment the `CFBundleVersion` in the format `xxxx.xx.xx`, for example:

- `1000.1.1` > `1000.1.2`
- `1000.1.99` > `1000.2.1`
- `1000.99.99` > `1001.1.1`

Note that if your current `CFBundleVersion` is already greater that 9999 then
according to the documentation above it is already invalid. So, we will
just keep incrementing it following the pattern described above and hopefully
Apple won't complain!

### Pre-releases

Pre-release versions present to major challenges for Android, but iOS again gets
a little more complicated.

#### Android

For Android, it is fine to use pre-release versions such as `1.2.3-beta.1`
as the `vesionName`.

#### iOS

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

### Xcode project files

To help accommodate projects that use Xcode to manage their versioning this plugin
will update the `CURRENT_PROJECT_VERSION` in the same way as the `CFBundleVersion`
and the `MARKETING_VERSION` in the same was as the `CFBundleShortVersionString`.
If these variables are not present in the first place then nothing will be added.

Whether or not you choose to commit these updates is up to you. If you are not
actually using these variables in your `Info.plist` files then they are probably
redundant anyway.
