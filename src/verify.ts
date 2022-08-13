import fs from 'fs';
import { PluginConfig } from './types';
import { toAbsolutePath } from './paths';
import { getError } from './errors';

const verifyAndroidPath = (androidPath: string) => {
  const absAndroidPath = toAbsolutePath(androidPath);

  if (!absAndroidPath.endsWith('build.gradle')) {
    return getError('androidPath', 'ENRNANDROIDPATH');
  }

  if (!fs.existsSync(absAndroidPath)) {
    return getError('androidPath', 'ENRNANDROIDPATH');
  }

  return null;
};

const verifyIosPath = (iosPath: string) => {
  const absIosPath = toAbsolutePath(iosPath);

  if (!fs.existsSync(absIosPath)) {
    return getError('iosPath', 'ENRNIOSPATH');
  }

  if (!fs.lstatSync(absIosPath).isDirectory()) {
    return getError('iosPath', 'ENRNIOSPATH');
  }

  return null;
};

export const verifyConditons = (pluginConfig: PluginConfig) => {
  const errors = [];

  if (pluginConfig.androidPath) {
    errors.push(verifyAndroidPath(pluginConfig.androidPath));
  }

  if (pluginConfig.iosPath) {
    errors.push(verifyIosPath(pluginConfig.iosPath));
  }

  const booleanValues: (keyof PluginConfig)[] = [
    'skipBuildNumber',
    'skipAndroid',
    'skipIos',
    'noPrerelease',
  ];

  booleanValues.forEach((key) => {
    if (key in pluginConfig && typeof pluginConfig[key] !== 'boolean') {
      errors.push(getError(key, 'ENRNNOTBOOLEAN'));
    }
  });

  if (
    'iosPackageName' in pluginConfig
    && !(typeof pluginConfig.iosPackageName === 'string' || pluginConfig.iosPackageName instanceof String)
  ) {
    errors.push(getError('iosPackageName', 'ENRNNOTSTRING'));
  }

  return errors.filter((x) => x);
};
