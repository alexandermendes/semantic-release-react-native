import appRoot from 'app-root-path';
import fs from 'fs';
import type { Context } from 'semantic-release';
import { publish } from '../src/publish';

jest.mock('fs');

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

describe('Android', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
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
    expect(logger.error).toHaveBeenCalledWith(`No file found at ${defaultAndroidPath}`);
  });

  it('updates to a prerelease version', async () => {
    const context = createContext({ version: '1.2.3-beta.1' });

    await publish({ skipIos: true }, context);

    expect(fs.writeFileSync).toHaveBeenCalledWith(defaultAndroidPath, [
      'versionName "1.2.3-beta.1"',
      'versionCode 101',
    ].join('\n'));
  });
});
