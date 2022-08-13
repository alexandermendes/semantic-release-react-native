import fs from 'fs';
import path from 'path';
import type { Context } from 'semantic-release';
import type { FullPluginConfig } from '../types';
import { toAbsolutePath } from '../paths';
import { getSemanticBuildNumber, getVersion } from './utils';

/**
 * Get the path to the Android bundle.gradle file.
 */
const getAndroidPath = (androidPath?: string) => {
  const defaultAndroidPath = path.join('android', 'app', 'build.gradle');

  return toAbsolutePath(androidPath ?? defaultAndroidPath);
};

/**
 * Get the next version code for Android according to the chosen strategy.
 */
const getNextAndroidVersionCode = (
  strategy: FullPluginConfig['versionStrategy']['android'],
  logger: Context['logger'],
  version: string,
  currentVersionCode: string,
  minSdkVersion?: string,
) => {
  if (strategy?.buildNumber === 'none') {
    return currentVersionCode;
  }

  if (strategy?.buildNumber === 'semantic') {
    const semanticBuildNumber = getSemanticBuildNumber(version, logger, 'Android');

    if (!semanticBuildNumber) {
      return currentVersionCode;
    }

    return semanticBuildNumber;
  }

  if (strategy?.buildNumber === 'semantic-extended') {
    if (!minSdkVersion) {
      logger.warn(
        'Could not update Android versionCode using the semantic-extended strategy '
        + 'as the minSdkVersion could not be determined.',
      );

      return currentVersionCode;
    }

    if (minSdkVersion.length > 2) {
      logger.warn(
        'Could not update Android versionCode using the semantic-extended strategy '
        + 'as the minSdkVersion is greater than 99. Welcome to the future. Have the '
        + 'robots taken over yet?',
      );

      return currentVersionCode;
    }

    const semanticBuildNumber = getSemanticBuildNumber(version, logger, 'Android');

    if (!semanticBuildNumber) {
      return currentVersionCode;
    }

    return `${minSdkVersion.padStart(2, '0')}0${semanticBuildNumber}`;
  }

  return String(parseInt(currentVersionCode, 10) + 1);
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
    const [, minSdkVersion] = gradleFile.match(/minSdkVersion (\d+)/) || [];

    gradleFile = gradleFile.replace(/versionCode (\d+)/, (_match, currentVersionCode) => {
      newBuildNumber = getNextAndroidVersionCode(
        pluginConfig.versionStrategy.android,
        logger,
        version,
        currentVersionCode,
        minSdkVersion,
      );

      return `versionCode ${newBuildNumber}`;
    });

    logger.success(`Android versionCode > ${newBuildNumber}`);
  }

  fs.writeFileSync(androidPath, gradleFile);
};
