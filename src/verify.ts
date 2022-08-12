import fs from 'fs';
import { PluginConfig } from './types';
import { toAbsolutePath } from './paths';
import { getError } from './errors';

const verifyAndroidPath = (androidPath: string) => {
  const absAndroidPath = toAbsolutePath(androidPath);

  if (!absAndroidPath.endsWith('build.gradle')) {
    return getError('ENRNANDROIDPATH');
  }

  if (!fs.existsSync(absAndroidPath)) {
    return getError('ENRNANDROIDPATH');
  }

  return null;
};

const verifyIosPath = (iosPath: string) => {
  const absIosPath = toAbsolutePath(iosPath);

  if (!fs.existsSync(absIosPath)) {
    return getError('ENRNIOSPATH');
  }

  if (!fs.lstatSync(absIosPath).isDirectory()) {
    return getError('ENRNIOSPATH');
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

  return errors.filter((x) => x);
};
