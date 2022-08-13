import fs from 'fs';
import path from 'path';
import plist, { PlistObject, PlistValue } from 'plist';
import semver from 'semver';
import { Xcode } from 'pbxproj-dom/xcode';
import unique from 'lodash.uniq';
import flattenDeep from 'lodash.flattendeep';
import type { Context } from 'semantic-release';
import type { PluginConfig } from './types';
import { toAbsolutePath } from './paths';

/**
 * Get the path to the Android bundle.gradle file.
 */
const getAndroidPath = (androidPath?: string) => {
  const defaultAndroidPath = path.join('android', 'app', 'build.gradle');

  return toAbsolutePath(androidPath ?? defaultAndroidPath);
};

/**
 * Get the path to the iOS Xcode project file.
 */
const getIosPath = (iosPath?: string) => {
  const defaultIosPath = path.join('ios');

  return toAbsolutePath(iosPath ?? defaultIosPath);
};

/**
 * Strip any pre-release label from a version (e.g. 1.2.3-beta.1).
 *
 * iOS do not accept pre-release versions against CFBundleShortVersionString.
 *
 * @see https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring
 */
const stripPrereleaseVersion = (version: string) => {
  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  return `${major}.${minor}.${patch}`;
};

/**
 * Get a build number for iOS.
 */
const getCfBundleVersion = (previousBundleVersion: string, version: string) => {
  const [majorStr, minorStr, patchStr] = previousBundleVersion.split('.');
  let major = parseInt(majorStr ?? 0, 10);
  let minor = parseInt(minorStr ?? 0, 10);
  let patch = parseInt(patchStr ?? 0, 10);

  let versioned = false;

  if (patch >= 99) {
    minor += 1;
    patch = 1;
    versioned = true;
  }

  if (minor >= 99) {
    major += 1;
    minor = 1;
    patch = 1;
    versioned = true;
  }

  if (!major) {
    major += 1;
    versioned = true;
  }

  if (!minor) {
    minor += 1;
    versioned = true;
  }

  if (!versioned || !patch) {
    patch += 1;
  }

  let bundleVersion = `${major}.${minor}.${patch}`;

  const preReleaseLabel = version.split('-');

  if (!preReleaseLabel) {
    return bundleVersion;
  }

  const preReleaseChar = preReleaseLabel[1][0];
  const validPreReleaseChar = ['a', 'b', 'd', 'f'].includes(preReleaseChar)
    ? preReleaseChar
    : 'f';

  const preReleaseVersion = parseInt(preReleaseLabel[1]?.split('.')[1] ?? 0, 10);

  bundleVersion += `${validPreReleaseChar}${preReleaseVersion}`;

  return bundleVersion;
};

/**
 * Update Android files with the new version.
 *
 * @see https://developer.android.com/studio/publish/versioning
 */
const versionAndroid = (
  version: string,
  pluginConfig: PluginConfig,
  context: Context,
) => {
  const { logger } = context;

  logger.info('Versioning Android');

  const androidPath = getAndroidPath(pluginConfig.androidPath);

  if (!fs.existsSync(androidPath)) {
    logger.error(`No file found at ${androidPath}`);

    return;
  }

  let gradleFile = fs.readFileSync(androidPath).toString();
  let newBuildNumber;

  gradleFile = gradleFile.replace(
    /versionName (["'])(.*)["']/,
    `versionName $1${version}$1`,
  );

  logger.success(`Android versionName > ${version}`);

  if (!pluginConfig.skipBuildNumber) {
    gradleFile = gradleFile.replace(/versionCode (\d+)/, (_match, currentVersionCode) => {
      newBuildNumber = String(parseInt(currentVersionCode, 10) + 1);

      return `versionCode ${newBuildNumber}`;
    });

    logger.success(`Android versionCode > ${newBuildNumber}`);
  }

  fs.writeFileSync(androidPath, gradleFile);
};

/**
 * Get Info.plist filenames.
 */
const getPlistFilenames = (xcode: Xcode) => unique(
  flattenDeep(
    xcode.document.projects.map((project) => (
      project.targets.filter(Boolean).map((target) => (
        target.buildConfigurationsList.buildConfigurations.map((config) => (
          config.ast.value.get('buildSettings').get('INFOPLIST_FILE').text
        )))))),
  ),
);

/**
 * Increment the build number in all Xcode projects.
 */
const incrementPbxProjectBuildNumbers = (
  xcode: Xcode,
  logger: Context['logger'],
  iosPackageName?: string,
) => {
  const currentProjectVersionKey = 'CURRENT_PROJECT_VERSION';

  xcode.document.projects.forEach((project) => {
    const validTargets = project.targets.filter(Boolean);

    validTargets.forEach((target) => {
      const validBuildConfigs = target.buildConfigurationsList.buildConfigurations.filter(() => (
        !iosPackageName || iosPackageName === target.name
      ));

      validBuildConfigs.forEach((buildConfig) => {
        const currentBuildNumber = parseInt(
          buildConfig.ast.value
            .get('buildSettings')
            .get(currentProjectVersionKey)?.text,
          10,
        );

        if (!currentBuildNumber) {
          return;
        }

        const newBuildNumber = currentBuildNumber + 1;

        buildConfig.patch({
          buildSettings: {
            [currentProjectVersionKey]: newBuildNumber,
          },
        });

        logger.success(
          `iOS ${target.name} ${currentProjectVersionKey} > ${newBuildNumber}`,
        );
      });
    });
  });

  xcode.save();
};

/**
 * Check if a parsed plist value is an object.
 */
const isPlistObject = (value: PlistValue): value is PlistObject => (
  typeof (value as PlistObject) === 'object'
);

/**
 * Increment version numbers in all plist files.
 */
const incrementPlistVersions = (
  pluginConfig: PluginConfig,
  xcode: Xcode,
  iosPath: string,
  version: string,
  logger: Context['logger'],
) => {
  const plistFilenames = getPlistFilenames(xcode);

  plistFilenames.forEach((plistFilename) => {
    const plistFile = fs.readFileSync(
      path.join(iosPath, plistFilename),
    ).toString();

    const plistObj = plist.parse(plistFile);

    if (!isPlistObject(plistObj)) {
      return;
    }

    const shortVersion = stripPrereleaseVersion(version);

    Object.assign(plistObj, {
      CFBundleShortVersionString: shortVersion,
    });

    logger.success(`iOS ${plistFilename} CFBundleShortVersionString > ${shortVersion}`);

    if (!pluginConfig.skipBuildNumber && plistObj.CFBundleVersion) {
      const newBuildVersion = String(plistObj.CFBundleVersion);

      Object.assign(plistObj, {
        CFBundleVersion: getCfBundleVersion(newBuildVersion, version),
      });

      logger.success(`iOS ${plistFilename} CFBundleVersion > ${newBuildVersion}`);
    }

    fs.writeFileSync(path.join(iosPath, plistFilename), plist.build(plistObj));
  });
};

/**
 * Version iOS files.
 */
const versionIos = (
  version: string,
  pluginConfig: PluginConfig,
  context: Context,
) => {
  const { logger } = context;

  logger.info('Versioning iOS');

  const iosPath = getIosPath(pluginConfig.iosPath);

  const xcodeProjects = fs
    .readdirSync(iosPath)
    .filter((file) => /\.xcodeproj$/i.test(file));

  if (!xcodeProjects.length) {
    logger.error(`No Xcode project file found at ${iosPath}`);

    return;
  }

  const projectFolder = path.join(iosPath, xcodeProjects[0]);
  const xcode = Xcode.open(path.join(projectFolder, 'project.pbxproj'));

  if (!pluginConfig.skipBuildNumber) {
    incrementPbxProjectBuildNumbers(xcode, logger, pluginConfig.iosPackageName);
  }

  incrementPlistVersions(pluginConfig, xcode, iosPath, version, logger);
};

/**
 * Version Android and iOS files.
 */
export const publish = async (
  pluginConfig: PluginConfig,
  context: Context,
) => {
  const { nextRelease } = context;

  if (!nextRelease) {
    return;
  }

  let { version } = nextRelease;

  if (pluginConfig.noPrerelease) {
    version = stripPrereleaseVersion(version);
  }

  if (!pluginConfig.skipAndroid) {
    versionAndroid(version, pluginConfig, context);
  }

  if (!pluginConfig.skipIos) {
    versionIos(version, pluginConfig, context);
  }
};
