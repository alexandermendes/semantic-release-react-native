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

## Versioning behaviour

By default this plugin will set the `vesionName` for Android and the `CFBundleShortVersionString`
for iOS to the version defined as the next semantic release.

### Pre-releases

For Android, pre-release version against the `vesionName` are fine (e.g. `1.2.3-beta.1`).

For iOS, the `CFBundleShortVersionString` property does not support pre-release
versions, so these will be stripped from the version set in your
`Info.plist` file (e.g. `1.2.3-beta.1` becomes `1.2.3`).

If you want to normalise this behaviour you can use the `noPrerelease` option.
