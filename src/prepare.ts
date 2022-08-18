import type { Context } from 'semantic-release';
import deepmerge from 'deepmerge';
import type { FullPluginConfig, PluginConfig } from './types';
import { versionAndroid } from './version/android';
import { versionIos } from './version/ios';
import { isPreRelease } from './version/utils';

const applyPluginConfigDefaults = (pluginConfig: PluginConfig): FullPluginConfig => deepmerge({
  androidPath: 'android/app/build.gradle',
  iosPath: 'ios',
  iosPackageName: null,
  skipBuildNumber: false,
  skipAndroid: false,
  skipIos: false,
  noPrerelease: false,
  versionStrategy: {
    android: {
      buildNumber: 'increment',
    },
    ios: {
      buildNumber: 'strict',
    },
  },
}, pluginConfig);

export const prepare = async (
  pluginConfig: PluginConfig,
  context: Context,
) => {
  const pConfig = applyPluginConfigDefaults(pluginConfig);
  const { logger, nextRelease } = context;

  if (isPreRelease(nextRelease) && pluginConfig.noPrerelease) {
    logger.info('Skipping pre-release version');

    return;
  }

  if (!pConfig.skipAndroid) {
    versionAndroid(pConfig, context);
  }

  if (!pConfig.skipIos) {
    versionIos(pConfig, context);
  }
};
