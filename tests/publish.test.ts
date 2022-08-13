import appRoot from 'app-root-path';
import fs from 'fs';
import { Xcode } from 'pbxproj-dom/xcode';
import plist from 'plist';
import type { Context } from 'semantic-release';
import { publish } from '../src/publish';

jest.mock('fs');
jest.mock('pbxproj-dom/xcode');
jest.mock('plist');

const logger = {
  log: jest.fn(),
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
} as unknown as Context['logger'];

const createContext = ({
  version = '1.2.3',
} = {}) => ({
  nextRelease: { version },
  logger,
  cwd: '/path/to/cwd',
} as unknown as Context);

const defaultAndroidPath = `${appRoot.path}/android/app/build.gradle`;
const defaultIosPath = `${appRoot.path}/ios`;

const getBuildSetting = jest.fn((value: string) => ({
  INFOPLIST_FILE: { text: 'Test/Info.plist' },
  CURRENT_PROJECT_VERSION: { text: 1 },
}[value]));

const buildConfig = {
  ast: {
    value: {
      get: (value: string) => ({
        buildSettings: {
          get: getBuildSetting,
        },
      }[value]),
    },
  },
  patch: jest.fn(),
};

const mockXcode = {
  save: jest.fn(),
  document: {
    projects: [
      {
        targets: [
          {
            buildConfigurationsList: {
              buildConfigurations: [buildConfig],
            },
          },
        ],
      },
    ],
  },
};

describe('Publish', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('Android', () => {
    beforeEach(() => {
      (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
        if (filePath.endsWith('build.gradle')) {
          return [
            'versionName "1.0.0"',
            'versionCode 100',
          ].join('\n');
        }

        return null;
      });
    });

    it('updates the versionName and versionCode', async () => {
      const context = createContext();

      await publish({ skipIos: true }, context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(defaultAndroidPath, [
        'versionName "1.2.3"',
        'versionCode 101',
      ].join('\n'));

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(defaultAndroidPath);

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(defaultAndroidPath);
    });

    it('skips the versionCode if the skipBuildNumber option was given', async () => {
      const context = createContext();

      await publish({ skipIos: true, skipBuildNumber: true }, context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(defaultAndroidPath, [
        'versionName "1.2.3"',
        'versionCode 100',
      ].join('\n'));
    });

    it('does not update anything if the skipAndroid option was given', async () => {
      const context = createContext();

      await publish({ skipIos: true, skipAndroid: true }, context);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('logs an error if no build.gradle was found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const context = createContext();

      await publish({ skipIos: true }, context);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        `No file found at ${defaultAndroidPath}`,
      );
    });

    it('updates to a prerelease version', async () => {
      const context = createContext({ version: '1.2.3-beta.1' });

      await publish({ skipIos: true }, context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(defaultAndroidPath, [
        'versionName "1.2.3-beta.1"',
        'versionCode 101',
      ].join('\n'));
    });

    it('strips a prerelease version if noPrerelease option given', async () => {
      const context = createContext({ version: '1.2.3-beta.1' });

      await publish({ skipIos: true, noPrerelease: true }, context);

      expect(fs.writeFileSync).toHaveBeenCalledWith(defaultAndroidPath, [
        'versionName "1.2.3"',
        'versionCode 101',
      ].join('\n'));
    });

    it('loads a build.gradle from a custom path', async () => {
      const context = createContext();
      const androidPath = 'src/android/build.gradle';

      await publish({ skipIos: true, androidPath: `./${androidPath}` }, context);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(`${appRoot.path}/${androidPath}`);

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(`${appRoot.path}/${androidPath}`);
    });

    it('loads a build.gradle from a custom absolute path', async () => {
      const context = createContext();
      const androidPath = '/absolute/build.gradle';

      await publish({ skipIos: true, androidPath }, context);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(androidPath);

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(androidPath);
    });
  });

  describe('iOS', () => {
    beforeEach(() => {
      (fs.readdirSync as jest.Mock).mockImplementation((filePath) => {
        if (filePath.endsWith('ios')) {
          return ['Test.xcodeproj'];
        }

        return null;
      });

      (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
        if (filePath.endsWith('Info.plist')) {
          return 'mock-plist-file';
        }

        return null;
      });

      (Xcode.open as jest.Mock).mockReturnValue(mockXcode);
      (plist.parse as jest.Mock).mockReturnValue({
        CFBundleDisplayName: 'My App',
        CFBundleVersion: '100',
      });

      (plist.build as jest.Mock).mockReturnValue('mock-built-plist');

      getBuildSetting.mockImplementation((value: string) => ({
        INFOPLIST_FILE: { text: 'Test/Info.plist' },
        CURRENT_PROJECT_VERSION: { text: 1 },
        MARKETING_VERSION: { text: '1.1.1' },
      }[value]));
    });

    it('updates the project.pbxproj file', async () => {
      const context = createContext();

      await publish({ skipAndroid: true }, context);

      expect(buildConfig.patch).toHaveBeenCalledTimes(1);
      expect(buildConfig.patch).toHaveBeenCalledWith({
        buildSettings: {
          CURRENT_PROJECT_VERSION: '1.1.1',
          MARKETING_VERSION: '1.2.3',
        },
      });

      expect(mockXcode.save).toHaveBeenCalled();

      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        `${appRoot.path}/ios/Test/Info.plist`,
      );

      expect(plist.parse).toHaveBeenCalledTimes(1);
      expect(plist.parse).toHaveBeenCalledWith('mock-plist-file');

      expect(plist.build).toHaveBeenCalledTimes(1);
      expect(plist.build).toHaveBeenCalledWith({
        CFBundleDisplayName: 'My App',
        CFBundleShortVersionString: '1.2.3',
        CFBundleVersion: '100.1.1',
      });

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${appRoot.path}/ios/Test/Info.plist`,
        'mock-built-plist',
      );
    });

    it('starts CFBundleVersion from 1.1.1 if it does not exist', async () => {
      (plist.parse as jest.Mock).mockReturnValue({
        CFBundleDisplayName: 'My App',
      });

      const context = createContext();

      await publish({ skipAndroid: true }, context);

      expect(plist.build).toHaveBeenCalledTimes(1);
      expect(plist.build).toHaveBeenCalledWith({
        CFBundleDisplayName: 'My App',
        CFBundleShortVersionString: '1.2.3',
        CFBundleVersion: '1.1.1',
      });
    });

    it('skips incrementing the bundle version', async () => {
      const context = createContext();

      await publish({ skipAndroid: true, skipBuildNumber: true }, context);

      expect(plist.build).toHaveBeenCalledTimes(1);
      expect(plist.build).toHaveBeenCalledWith({
        CFBundleDisplayName: 'My App',
        CFBundleShortVersionString: '1.2.3',
        CFBundleVersion: '100',
      });

      expect(buildConfig.patch).toHaveBeenCalledTimes(1);
      expect(buildConfig.patch).toHaveBeenCalledWith({
        buildSettings: {
          MARKETING_VERSION: '1.2.3',
        },
      });
    });

    it('skips any project.pbxproj files with a missing CURRENT_PROJECT_VERSION', async () => {
      getBuildSetting.mockImplementation((value: string) => ({
        INFOPLIST_FILE: { text: 'Test/Info.plist' },
      }[value]));

      const context = createContext();

      await publish({ skipAndroid: true, skipBuildNumber: true }, context);

      expect(buildConfig.patch).not.toHaveBeenCalled();
    });

    it('logs an error if no xcodeproj was found', async () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([]);

      const context = createContext();

      await publish({ skipAndroid: true }, context);

      expect(fs.writeFileSync).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        `No Xcode project file found at ${defaultIosPath}`,
      );
    });

    it.each`
    previousBundleVersion  | expectedBundleVersion
      ${'1'}               | ${'1.1.1'}
      ${'1000'}            | ${'1000.1.1'}
      ${'1000.1'}          | ${'1000.1.1'}
      ${'1000.1.1'}        | ${'1000.1.2'}
      ${'1000.1.99'}       | ${'1000.2.1'}
      ${'1000.99.99'}      | ${'1001.1.1'}
      ${'12345'}           | ${'12345.1.1'}
      ${'0.0.1'}           | ${'1.1.1'}
      ${'100.100.100'}     | ${'101.1.1'}
    `(
      'sets the CFBundleVersion to $previousBundleVersion from $expectedBundleVersion',
      async ({ previousBundleVersion, expectedBundleVersion }) => {
        const context = createContext();

        (plist.parse as jest.Mock).mockReturnValue({
          CFBundleVersion: previousBundleVersion,
        });

        getBuildSetting.mockImplementation((value: string) => ({
          INFOPLIST_FILE: { text: 'Test/Info.plist' },
          CURRENT_PROJECT_VERSION: { text: previousBundleVersion },
        }[value]));

        await publish({ skipAndroid: true }, context);

        expect(plist.build).toHaveBeenCalledTimes(1);
        expect((plist.build as jest.Mock).mock.calls[0][0].CFBundleVersion).toBe(
          expectedBundleVersion,
        );

        expect(buildConfig.patch).toHaveBeenCalledTimes(1);
        expect(buildConfig.patch).toHaveBeenCalledWith({
          buildSettings: {
            CURRENT_PROJECT_VERSION: expectedBundleVersion,
          },
        });
      },
    );

    it.each`
      version               | previousBundleVersion | expectedBundleVersion
      ${'1.2.3-alpha.1'}    | ${'1.1.1'}            | ${'1.1.2a1'}
      ${'1.2.3-beta.3'}     | ${'1.1.1'}            | ${'1.1.2b3'}
      ${'1.2.3-feature.42'} | ${'1.1.1'}            | ${'1.1.2f42'}
      ${'1.2.3-hello.12'}   | ${'1.1.1'}            | ${'1.1.2f12'}
      ${'1.2.3-alpha.2'}    | ${'1.1.1a1'}          | ${'1.1.2a2'}
      ${'1.2.3-beta.1'}     | ${'1.1.1a1'}          | ${'1.1.2b1'}
    `(
      'sets the bundle version to $expectedBundleVersion for version $version',
      async ({ version, previousBundleVersion, expectedBundleVersion }) => {
        const context = createContext({ version });

        (plist.parse as jest.Mock).mockReturnValue({
          CFBundleVersion: previousBundleVersion,
        });

        getBuildSetting.mockImplementation((value: string) => ({
          INFOPLIST_FILE: { text: 'Test/Info.plist' },
          CURRENT_PROJECT_VERSION: { text: previousBundleVersion },
          MARKETING_VERSION: { text: '1.1.1' },
        }[value]));

        await publish({ skipAndroid: true }, context);

        expect(plist.build).toHaveBeenCalledTimes(1);
        expect(plist.build).toHaveBeenCalledWith({
          CFBundleShortVersionString: '1.2.3',
          CFBundleVersion: expectedBundleVersion,
        });

        expect(buildConfig.patch).toHaveBeenCalledTimes(1);
        expect(buildConfig.patch).toHaveBeenCalledWith({
          buildSettings: {
            CURRENT_PROJECT_VERSION: expectedBundleVersion,
            MARKETING_VERSION: '1.2.3',
          },
        });
      },
    );

    it('strips a prerelease version if noPrerelease option given', async () => {
      const context = createContext({ version: '1.2.3-alpha.1' });

      (plist.parse as jest.Mock).mockReturnValue({
        CFBundleVersion: '1.1.1',
      });

      getBuildSetting.mockImplementation((value: string) => ({
        INFOPLIST_FILE: { text: 'Test/Info.plist' },
        CURRENT_PROJECT_VERSION: { text: '1.1.1' },
      }[value]));

      await publish({ skipAndroid: true, noPrerelease: true }, context);

      expect(plist.build).toHaveBeenCalledTimes(1);
      expect((plist.build as jest.Mock).mock.calls[0][0].CFBundleVersion).toBe(
        '1.1.2',
      );

      expect(buildConfig.patch).toHaveBeenCalledTimes(1);
      expect(buildConfig.patch).toHaveBeenCalledWith({
        buildSettings: {
          CURRENT_PROJECT_VERSION: '1.1.2',
        },
      });
    });

    it('ignores any variables against the CFBundleVersion', async () => {
      (plist.parse as jest.Mock).mockReturnValue({
        CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
      });

      getBuildSetting.mockImplementation((value: string) => ({
        INFOPLIST_FILE: { text: 'Test/Info.plist' },
        CURRENT_PROJECT_VERSION: { text: '1.1.1' },
      }[value]));

      const context = createContext();

      await publish({ skipAndroid: true }, context);

      expect(plist.build).toHaveBeenCalledTimes(1);
      expect(plist.build).toHaveBeenCalledWith({
        CFBundleShortVersionString: '1.2.3',
        CFBundleVersion: '$(CURRENT_PROJECT_VERSION)',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Not updating iOS Test/Info.plist CFBundleVersion as it is the variable "$(CURRENT_PROJECT_VERSION)"',
      );

      expect(buildConfig.patch).toHaveBeenCalledTimes(1);
      expect(buildConfig.patch).toHaveBeenCalledWith({
        buildSettings: {
          CURRENT_PROJECT_VERSION: '1.1.2',
        },
      });
    });
  });
});
