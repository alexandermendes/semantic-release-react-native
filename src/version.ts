import fs from 'fs';
import path from 'path';
import plist, { PlistObject, PlistValue } from 'plist';
import semver from 'semver';
import { Xcode } from 'pbxproj-dom/xcode';
import unique from 'lodash.uniq';
import flattenDeep from 'lodash.flattendeep';
import type { Context, NextRelease } from 'semantic-release';
import type { FullPluginConfig } from './types';
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
 * Get a build version for iOS.
 */
const getIosBundleVersion = (previousBundleVersion: string, version: string) => {
  const [majorStr, minorStr, patchStr] = previousBundleVersion.split('.');
  let major = parseInt(majorStr ?? 0, 10);
  let minor = parseInt(minorStr ?? 0, 10);
  let patch = parseInt(patchStr ?? 0, 10);

  if (!previousBundleVersion) {
    return '1.1.1';
  }

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

  const [, preReleaseLabel] = version.split('-');

  if (!preReleaseLabel) {
    return bundleVersion;
  }

  const preReleaseChar = preReleaseLabel[0];
  const validPreReleaseChar = ['a', 'b', 'd', 'f'].includes(preReleaseChar)
    ? preReleaseChar
    : 'f';

  const preReleaseVersion = parseInt(preReleaseLabel.split('.')[1] ?? 1, 10);

  bundleVersion += `${validPreReleaseChar}${preReleaseVersion}`;

  return bundleVersion;
};

/**
 * Get Info.plist filenames.
 */
const getPlistFilenames = (xcode: Xcode) => unique(
  flattenDeep(
    xcode.document.projects.map((project) => (
      project.targets.filter(Boolean).map((target) => (
        target.buildConfigurationsList.buildConfigurations.map((config) => (
          config.ast.value.get('buildSettings').get('INFOPLIST_FILE')?.text
        )))))),
  ),
).filter((x) => x);

/**
 * Increment the build number in all Xcode projects.
 */
const incrementPbxProjectBuildNumbers = (
  xcode: Xcode,
  logger: Context['logger'],
  version: string,
  pluginConfig: FullPluginConfig,
) => {
  const currentProjectVersionKey = 'CURRENT_PROJECT_VERSION';
  const marketingVersionKey = 'MARKETING_VERSION';
  const { iosPackageName, skipBuildNumber } = pluginConfig;

  xcode.document.projects.forEach((project) => {
    const validTargets = project.targets.filter(Boolean);

    validTargets.forEach((target) => {
      const validBuildConfigs = target.buildConfigurationsList.buildConfigurations.filter(() => (
        !iosPackageName || iosPackageName === target.name
      ));

      validBuildConfigs.forEach((buildConfig) => {
        const currentProjectVersion = buildConfig.ast.value
          .get('buildSettings')
          .get(currentProjectVersionKey)?.text;

        const currentMarketingVersion = buildConfig.ast.value
          .get('buildSettings')
          .get(marketingVersionKey)?.text;

        const buildSettings = {};

        if (currentMarketingVersion) {
          const newMarketingVersion = stripPrereleaseVersion(version);

          Object.assign(buildSettings, {
            [marketingVersionKey]: newMarketingVersion,
          });

          logger.success(
            `iOS ${target.name} ${marketingVersionKey} > ${newMarketingVersion}`,
          );
        }

        if (currentProjectVersion && !skipBuildNumber) {
          const newProjectVersion = getIosBundleVersion(String(currentProjectVersion), version);

          Object.assign(buildSettings, {
            [currentProjectVersionKey]: newProjectVersion,
          });

          logger.success(
            `iOS ${target.name} ${currentProjectVersionKey} > ${newProjectVersion}`,
          );
        }

        if (Object.keys(buildSettings).length) {
          buildConfig.patch({ buildSettings });
        }
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
 * Update the CFBundleVersion property.
 */
const updateCfBundleVersion = (
  plistFilename: string,
  plistObj: PlistObject,
  version: string,
  logger: Context['logger'],
) => {
  const key = 'CFBundleVersion';
  const currentBuildVersion = plistObj[key] ? String(plistObj[key]) : '';
  const newBuildVersion = getIosBundleVersion(currentBuildVersion, version);

  if (currentBuildVersion.startsWith('$(')) {
    logger.info(
      `Not updating iOS ${plistFilename} ${key} as it is the variable "${currentBuildVersion}"`,
    );

    return;
  }

  Object.assign(plistObj, { [key]: newBuildVersion });
  logger.success(`iOS ${plistFilename} ${key} > ${newBuildVersion}`);
};

/**
 * Update the CFBundleShortVersionString property.
 */
const updateCfBundleShortVersion = (
  plistFilename: string,
  plistObj: PlistObject,
  version: string,
  logger: Context['logger'],
) => {
  const key = 'CFBundleShortVersionString';
  const shortVersion = stripPrereleaseVersion(version);
  const currentVersion = plistObj[key];

  if (String(currentVersion).startsWith('$(')) {
    logger.info(
      `Not updating iOS ${plistFilename} ${key} as it is the variable "${currentVersion}"`,
    );

    return;
  }

  Object.assign(plistObj, { [key]: shortVersion });
  logger.success(`iOS ${plistFilename} ${key} > ${shortVersion}`);
};

/**
 * Increment version numbers in all plist files.
 */
const incrementPlistVersions = (
  pluginConfig: FullPluginConfig,
  xcode: Xcode,
  iosPath: string,
  version: string,
  logger: Context['logger'],
) => {
  const plistFilenames = getPlistFilenames(xcode);

  plistFilenames
    .filter((plistFilename) => (
      !pluginConfig.iosPackageName
      || path.dirname(plistFilename) === pluginConfig.iosPackageName
    ))
    .forEach((plistFilename) => {
      const plistFile = fs.readFileSync(
        path.join(iosPath, plistFilename),
      ).toString();

      const plistObj = plist.parse(plistFile);

      if (!isPlistObject(plistObj)) {
        return;
      }

      updateCfBundleShortVersion(plistFilename, plistObj, version, logger);

      if (!pluginConfig.skipBuildNumber) {
        updateCfBundleVersion(plistFilename, plistObj, version, logger);
      }

      fs.writeFileSync(path.join(iosPath, plistFilename), plist.build(plistObj));
    });
};

/**
 * Get the version to be released, if any.
 */
const getVersion = (noPrerelease: boolean, nextRelease?: NextRelease) => {
  if (!nextRelease) {
    return null;
  }

  return noPrerelease
    ? stripPrereleaseVersion(nextRelease.version)
    : nextRelease.version;
};

/**
 * Version iOS files.
 */
export const versionIos = (
  pluginConfig: FullPluginConfig,
  context: Context,
) => {
  const { logger } = context;
  const version = getVersion(pluginConfig.noPrerelease, context.nextRelease);

  if (!version) {
    return;
  }

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

  incrementPbxProjectBuildNumbers(xcode, logger, version, pluginConfig);

  incrementPlistVersions(pluginConfig, xcode, iosPath, version, logger);
};

/**
 * Update Android files with the new version.
 *
 * @see https://developer.android.com/studio/publish/versioning
 */
export const versionAndroid = (
  pluginConfig: FullPluginConfig,
  context: Context,
) => {
  const { logger } = context;
  const version = getVersion(pluginConfig.noPrerelease, context.nextRelease);

  if (!version) {
    return;
  }

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
