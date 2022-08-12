# semantic-release-react-native

[![npm version](https://badge.fury.io/js/semantic-release-react-native.svg)](https://badge.fury.io/js/semantic-release-react-native)

A [Semantic Release](https://github.com/semantic-release/semantic-release) plugin
for versioning [React Native](https://reactnative.dev/) applications.

| Step      | Description                                                            |
|-----------|------------------------------------------------------------------------|
| `publish` | Update the relevant iOS and Android files with the new version number. |

## Installation

```
npm install semantic-release-react-native -D
```

## Usage

The plugin can be configured in the [Semantic Release configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "semantic-release-react-native",
  ]
}
```

## Configuration

| Property               | Description                                        | Default                    |
|------------------------|----------------------------------------------------|----------------------------|
| `androidPath`          | Path to your "android/app/build.gradle" file.      | `android/app/build.gradle` |
| `iosPath`              | Path to your "ios/" folder.                        | `ios`                      |
| `skipBuildNumber`      | Do not increment the build number.                 | `false`                    |
| `skipAndroid`          | Skip Android versioning.                           | `false`                    |
| `skipIos`              | Skip iOS versioning.                               | `false`                    |
| `iosPackageName`       | Only update iOS projects that have the given name. | `undefined`                |
