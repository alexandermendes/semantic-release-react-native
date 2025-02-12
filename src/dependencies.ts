import appRoot from 'app-root-path';
import path from 'path';
import fs from 'fs';

export const hasDependency = (name: string) => {
  const packageJsonPath = path.join(appRoot.path, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  return name in allDependencies;
};
