import semver from 'semver';
import type { Context, NextRelease } from 'semantic-release';

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
 * For example, v1.2.3 becomes 102030.
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
      `Could not update ${platform} bundle version using the semantic strategy `
      + 'as the numbers in your semantic version exceed two digits. It is '
      + 'recommended that you switch to the increment strategy (see plugin docs).',
    );

    return null;
  }

  return semanticBuildNumber;
};

/**
 * Get the version to be released, if any.
 */
export const getVersion = (noPrerelease: boolean, nextRelease?: NextRelease) => {
  if (!nextRelease) {
    return null;
  }

  return noPrerelease
    ? stripPrereleaseVersion(nextRelease.version)
    : nextRelease.version;
};
