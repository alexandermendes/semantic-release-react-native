export type PluginConfig = {
  androidPath?: string;
  iosPath?: string;
  iosPackageName?: String | string | null;
  skipBuildNumber?: boolean;
  skipAndroid?: boolean;
  skipIos?: boolean;
  noPrerelease?: boolean;
  versionStrategy?: {
    android?: {
      buildNumber: 'increment' | 'semantic' | 'semantic-extended' | 'none';
    },
    ios?: {
      buildNumber: 'strict' | 'increment' | 'semantic' | 'none';
    };
  };
};

export type FullPluginConfig = Required<PluginConfig>;
