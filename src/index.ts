import fs from 'fs';
import appRoot from 'app-root-path';
import path from 'path';
import type { Context } from 'semantic-release';

type PluginConfig = {
  androidPath: string;
  incrementBuildNumber?: boolean;
};

type PluginContext = Context & {
  cwd: string;
};

/**
 * Get an absolute path.
 *
 * Uses the base path of the repo if the given path is not already absolute.
 */
const toAbsolutePath = (filePath: string, basePath: string) => path.isAbsolute(filePath)
  ? filePath
  : path.join(basePath, filePath);

/**
 * Get the path to the Android bundle.gradle file.
 */
const getAndroidPath = (pluginConfig: PluginConfig, basePath: string) => {
  const defaultAndroidPath = path.join('android', 'app', 'build.gradle');
  const androidPath = pluginConfig.androidPath ?? defaultAndroidPath;

  return toAbsolutePath(androidPath, basePath);
};

/**
 * Get the base path for the repo.
 */
const getBasePath = (cwd: string) => appRoot.path ? path.resolve(cwd, appRoot.path) : cwd;

/**
 * Update Android files with the new version.
 *
 * @see https://developer.android.com/studio/publish/versioning
 */
const versionAndroid = (
  version: string,
  pluginConfig: PluginConfig,
  context: PluginContext,
) => {
  const { logger, cwd } = context;

  logger.info('Updating Android version');

  const basePath = getBasePath(cwd);
  const androidPath = getAndroidPath(pluginConfig, basePath);

  if (!fs.existsSync(androidPath)) {
    logger.error(`No file found at ${androidPath}`);

    return;
  }

  let gradleFile = fs.readFileSync(androidPath).toString();

  gradleFile = gradleFile.replace(
    /versionName (["'])(.*)["']/,
    `versionName $1${version}$1`,
  );

  if (pluginConfig.incrementBuildNumber) {
    gradleFile = gradleFile.replace(/versionCode (\d+)/, (_match, currentVersionCode) => (
      String(parseInt(currentVersionCode, 10) + 1)
    ));
  }

  fs.writeFileSync(androidPath, gradleFile);
  logger.success(`Android version updated to ${version}`);
};

export const generateNotes = async (
  pluginConfig: PluginConfig,
  context: PluginContext,
) => {
  const { nextRelease, cwd } = context;

  if (!nextRelease) {
    return;
  }

  const { version } = nextRelease;
  const basePath = appRoot.path ? path.resolve(cwd, appRoot.path) : cwd;

  versionAndroid(version, pluginConfig, context);

  console.log(basePath, cwd);
};
