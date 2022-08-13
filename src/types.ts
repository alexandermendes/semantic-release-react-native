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
      buildNumber?: 'increment' | 'relative' | 'relative-extended' | 'none';
      preRelease?: boolean;
    },
    ios?: {
      buildNumber?: 'strict' | 'increment' | 'relative' | 'semantic' | 'none';
      preRelease?: boolean;
    };
  };
};

export type FullPluginConfig = Required<PluginConfig>;
