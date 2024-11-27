import { androidVesionStrategies, iosVesionStrategies } from './strategies';

type AndroidVersionStrategies = typeof androidVesionStrategies[number];

type IosVersionStrategies = typeof iosVesionStrategies[number];

export type PluginConfig = {
  androidPath?: string;
  iosPath?: string;
  iosPackageName?: String | string | null;
  skipBuildNumber?: boolean;
  skipAndroid?: boolean;
  skipIos?: boolean;
  noPrerelease?: boolean;
  fromFile?: string;
  versionStrategy?: {
    android?: {
      buildNumber?: AndroidVersionStrategies;
      preRelease?: boolean;
    },
    ios?: {
      buildNumber?: IosVersionStrategies;
      preRelease?: boolean;
    };
  };
};

export type FullPluginConfig = Required<PluginConfig>;

export type VersionFile = {
  android?: string;
  ios?: string;
};
