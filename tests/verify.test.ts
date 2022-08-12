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
        new Error('Invalid `androidPath`'),
      ]);
    });

    it('errors if the android path points to a build.gradle file that does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const androidPath = '/path/to/build.gradle';

      const errors = verifyConditons({ androidPath });

      expect(errors).toEqual([
        new Error('Invalid `androidPath`'),
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
        new Error('Invalid `iosPath`'),
      ]);

      expect(fs.existsSync).toHaveBeenCalledTimes(1);
      expect(fs.existsSync).toHaveBeenCalledWith(iosPath);
    });

    it('errors if the ios path is not a directory', () => {
      (fs.lstatSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      const iosPath = '/path/to/somewhere';

      const errors = verifyConditons({ iosPath });

      expect(errors).toEqual([
        new Error('Invalid `iosPath`'),
      ]);

      expect(fs.lstatSync).toHaveBeenCalledTimes(1);
      expect(fs.lstatSync).toHaveBeenCalledWith(iosPath);
    });
  });
});
