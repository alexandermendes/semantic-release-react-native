import fs from 'fs';
import { verifyConditons } from '../src/verify';

jest.mock('fs');

describe('verifyConditions', () => {
  beforeEach(() => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });

  describe('androidPath', () => {
    it('errors if the android path is not to a build.gradle file', () => {
      const errors = verifyConditons({ androidPath: 'no-good' });

      expect(errors).toEqual([
        new Error('Invalid androidPath'),
      ]);
    });

    it('errors if the android path points to a build.gradle file that does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const androidPath = '/path/to/build.gradle';

      const errors = verifyConditons({ androidPath });

      expect(errors).toEqual([
        new Error('Invalid androidPath'),
      ]);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(androidPath);
    });
  });

  describe('iosPath', () => {
    it('errors if the ios path does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const iosPath = '/path/to/somewhere';

      const errors = verifyConditons({ iosPath });

      expect(errors).toEqual([
        new Error('Invalid iosPath'),
      ]);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(iosPath);
    });

    it('errors if the ios path is not a directory', () => {
      (fs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      const iosPath = '/path/to/somewhere';

      const errors = verifyConditons({ iosPath });

      expect(errors).toEqual([
        new Error('Invalid iosPath'),
      ]);

      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(iosPath);
    });
  });

  describe.each([
    'skipBuildNumber',
    'skipAndroid',
    'skipIos',
    'noPrerelease',
  ])('%s', (key) => {
    it('errors if not a boolean', () => {
      // @ts-ignore
      const errors = verifyConditons({ [key]: 'no good' });

      expect(errors).toEqual([
        new Error(`Invalid ${key}`),
      ]);
    });

    it.each([true, false])('does not error if %s', (value) => {
      // @ts-ignore
      const errors = verifyConditons({ [key]: value });

      expect(errors).toEqual([]);
    });
  });

  describe('iosPackageName', () => {
    it('errors if not a string', () => {
      // @ts-ignore
      const errors = verifyConditons({ iosPackageName: false });

      expect(errors).toEqual([
        new Error('Invalid iosPackageName'),
      ]);
    });
  });

  describe('versionStrategy', () => {
    it('errors if an invalid ios version strategy is given', () => {
      const errors = verifyConditons({
        versionStrategy: {
          ios: {
            // @ts-ignore
            buildNumber: 'invalid',
          },
        },
      });

      expect(errors).toEqual([
        new Error('Invalid versionStrategy'),
      ]);
    });

    it('errors if an invalid android version strategy is given', () => {
      const errors = verifyConditons({
        versionStrategy: {
          android: {
            // @ts-ignore
            buildNumber: 'invalid',
          },
        },
      });

      expect(errors).toEqual([
        new Error('Invalid versionStrategy'),
      ]);
    });

    it('errors if an invalid ios pre-release strategy is given', () => {
      const errors = verifyConditons({
        versionStrategy: {
          ios: {
            // @ts-ignore
            preRelease: 'invalid',
          },
        },
      });

      expect(errors).toEqual([
        new Error('Invalid versionStrategy'),
      ]);
    });

    it('errors if an invalid android pre-release strategy is given', () => {
      const errors = verifyConditons({
        versionStrategy: {
          android: {
            // @ts-ignore
            preRelease: 'invalid',
          },
        },
      });

      expect(errors).toEqual([
        new Error('Invalid versionStrategy'),
      ]);
    });
  });
});
