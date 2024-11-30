import semver from 'semver';
import type { Context, NextRelease } from 'semantic-release';
import fs from 'fs';
import { EOL } from 'os';
import path from 'path';
import appRoot from 'app-root-path';
import { toError } from '../errors';
import { VersionFile } from '../types';

/**
 * Strip any pre-release label from a version (e.g. 1.2.3-beta.1).
 *
 * iOS do not accept pre-release versions against CFBundleShortVersionString.
 *
 * @see https://developer.apple.com/documentation/bundleresources/information_property_list/cfbundleshortversionstring
 */
export const stripPrereleaseVersion = (version: string) => {
  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);

  return `${major}.${minor}.${patch}`;
};

/**
 * Get a build number that is relative to the semantic version.
 *
 * For example, v1.2.3 becomes 10203.
 */
export const getSemanticBuildNumber = (
  version: string,
  logger: Context['logger'],
  platform: 'Android' | 'iOS',
) => {
  const major = String(semver.major(version)).padStart(2, '0');
  const minor = String(semver.minor(version)).padStart(2, '0');
  const patch = String(semver.patch(version)).padStart(2, '0');

  const semanticBuildNumber = `${major}${minor}${patch}`;

  if (major.length > 2 || minor.length > 2 || patch.length > 2) {
    logger.warn(
      `Could not update ${platform} bundle version using the relative strategy `
      + 'as the numbers in your semantic version exceed two digits. It is '
      + 'recommended that you switch to the increment strategy (see plugin docs).',
    );

    return null;
  }

  return semanticBuildNumber;
};

/**
 * Check if the next release is a pre-release.
 */
export const isPreRelease = (nextRelease?: NextRelease) => {
  const { version } = nextRelease ?? {};

  return version && semver.prerelease(version);
};

/**
 * Load the build version file.
 */
export const loadBuildVersionFile = (fileName: string): VersionFile => {
  const filePath = path.join(appRoot.path, fileName);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  let parsedContent: VersionFile;

  try {
    parsedContent = JSON.parse(fileContent);
  } catch (err) {
    throw new Error(`Could not parse ${fileName}: ${toError(err).message}`);
  }

  return parsedContent;
};

/**
 * Write a new build version file.
 */
export const writeBuildVersionFile = (
  fileName: string,
  newVersionFile: VersionFile,
) => {
  const filePath = path.join(appRoot.path, fileName);
  const fileContent = JSON.stringify(newVersionFile, null, 2);

  fs.writeFileSync(filePath, fileContent, 'utf8');
  fs.appendFileSync(filePath, EOL, 'utf8');
};
