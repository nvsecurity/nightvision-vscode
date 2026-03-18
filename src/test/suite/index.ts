import * as path from 'path';
import Mocha from 'mocha';
import * as glob from 'glob';
import { register } from 'tsconfig-paths';

// Register path aliases so tsc-compiled output can resolve @commands/*, etc.
const outDir = path.resolve(__dirname, '../..');
register({
  baseUrl: outDir,
  paths: {
    '@commands/*': ['commands/*'],
    '@components/*': ['components/*'],
    '@contexts/*': ['contexts/*'],
    '@hooks/*': ['hooks/*'],
    '@pages/*': ['pages/*'],
    '@types_/*': ['types/*'],
    '@constants/*': ['constants/*'],
    '@queries/*': ['queries/*'],
    '@icons/*': ['icons/*'],
    '@utils/*': ['utils/*'],
    '@styles/*': ['styles/*'],
  },
});

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true });
  const testsRoot = path.resolve(__dirname, '.');

  const files = glob.sync('**/**.test.js', { cwd: testsRoot });

  files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise<void>((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} tests failed.`));
      } else {
        resolve();
      }
    });
  });
}
