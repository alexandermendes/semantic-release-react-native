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
      buildNumber: 'increment' | 'relative' | 'relative-extended' | 'none';
    },
    ios?: {
      buildNumber: 'strict' | 'increment' | 'relative' | 'none';
    };
  };
};

export type FullPluginConfig = Required<PluginConfig>;
