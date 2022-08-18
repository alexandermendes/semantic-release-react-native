import fs from 'fs';
import path from 'path';
import plist, { PlistObject, PlistValue } from 'plist';
import beautify, { HTMLBeautifyOptions } from 'js-beautify';
import { Xcode } from 'pbxproj-dom/xcode';
import unique from 'lodash.uniq';
import detectIndent from 'detect-indent';
import flattenDeep from 'lodash.flattendeep';
import htmlMinifier from 'html-minifier';
import type { Context } from 'semantic-release';
import type { FullPluginConfig } from '../types';
import { toAbsolutePath } from '../paths';
import { getSemanticBuildNumber, isPreRelease, stripPrereleaseVersion } from './utils';

/**
 * Get the path to the iOS Xcode project file.
 */
const getIosPath = (iosPath?: string) => {
  const defaultIosPath = path.join('ios');

  return toAbsolutePath(iosPath ?? defaultIosPath);
};

/**
 * Get the bundle version for iOS using the strict strategy.
 */
const getIosStrictBundleVersion = (currentBundleVersion: string, version: string) => {
  const [majorStr, minorStr, patchStr] = currentBundleVersion.split('.');
  let major = parseInt(majorStr ?? 0, 10);
  let minor = parseInt(minorStr ?? 0, 10);
  let patch = parseInt(patchStr ?? 0, 10);

  if (!currentBundleVersion) {
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
 * Get a build version for iOS.
 */
const getIosBundleVersion = (
  strategy: FullPluginConfig['versionStrategy']['ios'],
  logger: Context['logger'],
  currentBundleVersion: string,
  version: string,
) => {
  if (strategy?.buildNumber === 'none') {
    return currentBundleVersion;
  }

  if (strategy?.buildNumber === 'semantic') {
    return stripPrereleaseVersion(version);
  }

  if (strategy?.buildNumber === 'relative') {
    const semanticBuildNumber = getSemanticBuildNumber(version, logger, 'iOS');

    if (!semanticBuildNumber) {
      return currentBundleVersion;
    }

    return semanticBuildNumber;
  }

  if (strategy?.buildNumber === 'increment') {
    const major = currentBundleVersion ? parseInt(currentBundleVersion, 10) : 0;

    return String(major + 1);
  }

  return getIosStrictBundleVersion(currentBundleVersion, version);
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
          const newProjectVersion = getIosBundleVersion(
            pluginConfig.versionStrategy.ios,
            logger,
            String(currentProjectVersion),
            version,
          );

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
  pluginConfig: FullPluginConfig,
  plistFilename: string,
  plistObj: PlistObject,
  version: string,
  logger: Context['logger'],
) => {
  const key = 'CFBundleVersion';
  const currentBuildVersion = plistObj[key] ? String(plistObj[key]) : '';
  const newBuildVersion = getIosBundleVersion(
    pluginConfig.versionStrategy.ios,
    logger,
    currentBuildVersion,
    version,
  );

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
 * Reset empty tags to those defined in the original file.
 *
 * Basically avoid converting <string /> to <string/> etc. as part of the effort
 * to end up with plist updates made in this plugin only modifying the version
 * fields and leaving anything else alone.
 */
const resetEmptyTagStyles = (originalContent: string, newContent: string) => {
  const originalLines = originalContent.trim().split(/\r?\n/);
  const newLines = newContent.trim().split(/\r?\n/);

  if (originalLines.length !== newLines.length) {
    return newContent;
  }

  return newLines.map((newLine, index) => {
    const originalLine = originalLines[index];

    if (htmlMinifier.minify(newLine).trim() === htmlMinifier.minify(originalLine).trim()) {
      return originalLine;
    }

    return newLine;
  }).join('\n');
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
      const plistPath = path.join(iosPath, plistFilename);
      const originalPlistFile = fs.readFileSync(plistPath).toString();
      const plistObj = plist.parse(originalPlistFile);

      if (!isPlistObject(plistObj)) {
        return;
      }

      updateCfBundleShortVersion(plistFilename, plistObj, version, logger);

      if (!pluginConfig.skipBuildNumber) {
        updateCfBundleVersion(pluginConfig, plistFilename, plistObj, version, logger);
      }

      const indent = detectIndent(originalPlistFile);
      const dictPattern = /<dict>[\s\S]*<\/dict>/i;
      const newPlistFile = plist.build(plistObj);
      const newPlistContent = newPlistFile.match(dictPattern)?.[0] ?? '';

      const [xmlDeclaration] = originalPlistFile.match(/<\?xml.*\?>/i) ?? [];
      const [doctypeElement] = originalPlistFile.match(/<\?doctype.*\?>/i) ?? [];
      const [plistElement] = originalPlistFile.match(/<\?plist.*\?>/i) ?? [];
      const beautifyOpts: HTMLBeautifyOptions = {};

      if (indent.type === 'tab') {
        beautifyOpts.indent_with_tabs = true;
      } else {
        beautifyOpts.indent_size = indent.amount;
      }

      let cleanPlistFile = [
        xmlDeclaration ?? '<?xml version="1.0" encoding="UTF-8"?>',
        doctypeElement ?? '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
        plistElement ?? '<plist version="1.0">',
        newPlistContent,
        '</plist>',
      ].join('\n');

      cleanPlistFile = cleanPlistFile.replace(
        dictPattern,
        beautify.html(newPlistContent, beautifyOpts),
      );

      fs.writeFileSync(
        plistPath,
        `${resetEmptyTagStyles(originalPlistFile, cleanPlistFile)}\n`,
      );
    });
};

/**
 * Version iOS files.
 */
export const versionIos = (
  pluginConfig: FullPluginConfig,
  context: Context,
) => {
  const { logger, nextRelease } = context;
  const { version } = nextRelease ?? {};

  if (!version) {
    return;
  }

  const { preRelease, buildNumber } = pluginConfig.versionStrategy.ios ?? {};

  if (
    isPreRelease(nextRelease)
    && (
      preRelease === false
      || (
        buildNumber
        && buildNumber !== 'strict'
      )
    )
  ) {
    logger.info('Skipping pre-release version for iOS');

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
