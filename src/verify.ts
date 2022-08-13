import fs from 'fs';
import { PluginConfig } from './types';
import { toAbsolutePath } from './paths';
import { getError } from './errors';
import { iosVesionStrategies } from './strategies';

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

  const { ios, android } = pluginConfig.versionStrategy ?? {};

  if (ios?.buildNumber && !iosVesionStrategies.includes(ios.buildNumber)) {
    errors.push(getError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (android?.buildNumber && !iosVesionStrategies.includes(android.buildNumber)) {
    errors.push(getError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (ios?.preRelease != null && typeof ios.preRelease !== 'boolean') {
    errors.push(getError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (android?.preRelease != null && typeof android.preRelease !== 'boolean') {
    errors.push(getError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  return errors.filter((x) => x);
};
