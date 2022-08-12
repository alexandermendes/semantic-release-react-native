import path from 'path';
import appRoot from 'app-root-path';

export const toAbsolutePath = (filePath: string) => (
  path.isAbsolute(filePath)
    ? filePath
    : path.join(appRoot.path, filePath)
);
