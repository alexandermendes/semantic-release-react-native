import type { Context } from 'semantic-release';
import type { FullPluginConfig, PluginConfig } from './types';
import { versionAndroid, versionIos } from './version';

const applyPluginConfigDefaults = (pluginConfig: PluginConfig): FullPluginConfig => ({
  androidPath: 'android/app/build.gradle',
  iosPath: 'ios',
  iosPackageName: null,
  skipBuildNumber: false,
  skipAndroid: false,
  skipIos: false,
  noPrerelease: false,
  ...pluginConfig,
});

export const publish = async (
  pluginConfig: PluginConfig,
  context: Context,
) => {
  const pConfig = applyPluginConfigDefaults(pluginConfig);

  if (!pConfig.skipAndroid) {
    versionAndroid(pConfig, context);
  }

  if (!pConfig.skipIos) {
    versionIos(pConfig, context);
  }
};
