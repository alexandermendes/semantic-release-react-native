import fs from 'fs';
import path from 'path';
import appRoot from 'app-root-path';
import { PluginConfig } from './types';
import { toAbsolutePath } from './paths';
import { getSemanticReleaseError } from './errors';
import { iosVesionStrategies } from './strategies';

const verifyAndroidPath = (androidPath: string) => {
  const absAndroidPath = toAbsolutePath(androidPath);

  if (!absAndroidPath.endsWith('build.gradle')) {
    return getSemanticReleaseError('androidPath', 'ENRNANDROIDPATH');
  }

  if (!fs.existsSync(absAndroidPath)) {
    return getSemanticReleaseError('androidPath', 'ENRNANDROIDPATH');
  }

  return null;
};

const verifyIosPath = (iosPath: string) => {
  const absIosPath = toAbsolutePath(iosPath);

  if (!fs.existsSync(absIosPath)) {
    return getSemanticReleaseError('iosPath', 'ENRNIOSPATH');
  }

  if (!fs.lstatSync(absIosPath).isDirectory()) {
    return getSemanticReleaseError('iosPath', 'ENRNIOSPATH');
  }

  return null;
};

const verifyJSONFile = (fileName: string) => {
  const filePath = path.join(appRoot.path, fileName);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return getSemanticReleaseError('fromFile', 'ENRNFROMFILENOTJSON');
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

  if (pluginConfig.fromFile) {
    errors.push(verifyJSONFile(pluginConfig.fromFile));
  }

  const booleanValues: (keyof PluginConfig)[] = [
    'skipBuildNumber',
    'skipAndroid',
    'skipIos',
    'noPrerelease',
  ];

  booleanValues.forEach((key) => {
    if (key in pluginConfig && typeof pluginConfig[key] !== 'boolean') {
      errors.push(getSemanticReleaseError(key, 'ENRNNOTBOOLEAN'));
    }
  });

  if (
    'iosPackageName' in pluginConfig
    && !(typeof pluginConfig.iosPackageName === 'string' || pluginConfig.iosPackageName instanceof String)
  ) {
    errors.push(getSemanticReleaseError('iosPackageName', 'ENRNNOTSTRING'));
  }

  const { ios, android } = pluginConfig.versionStrategy ?? {};

  if (ios?.buildNumber && !iosVesionStrategies.includes(ios.buildNumber)) {
    errors.push(getSemanticReleaseError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (android?.buildNumber && !iosVesionStrategies.includes(android.buildNumber)) {
    errors.push(getSemanticReleaseError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (ios?.preRelease != null && typeof ios.preRelease !== 'boolean') {
    errors.push(getSemanticReleaseError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  if (android?.preRelease != null && typeof android.preRelease !== 'boolean') {
    errors.push(getSemanticReleaseError('versionStrategy', 'ENRNVERSIONSTRATEGY'));
  }

  return errors.filter((x) => x);
};
