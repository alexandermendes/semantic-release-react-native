export type PluginConfig = {
  androidPath?: string;
  iosPath?: string;
  iosPackageName?: string | null;
  skipBuildNumber?: boolean;
  skipAndroid?: boolean;
  skipIos?: boolean;
  noPrerelease?: boolean;
};

export type FullPluginConfig = Required<PluginConfig>;
