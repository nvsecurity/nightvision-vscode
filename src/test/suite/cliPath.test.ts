import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveCLIPath } from '../../commands/InstallNightvisionCLI';

// The name spawn would resolve on this platform. Windows needs a real
// extension; elsewhere the executable bit does the work.
const exeName = process.platform === 'win32' ? 'nightvision.exe' : 'nightvision';

function writeExecutable(dir: string): string {
  const file = path.join(dir, exeName);
  fs.writeFileSync(file, '#!/bin/sh\n', { mode: 0o755 });
  return file;
}

suite('resolveCLIPath', () => {
  let tmpDir: string;
  let originalPath: string | undefined;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-cli-path-'));
    originalPath = process.env.PATH;
  });

  teardown(() => {
    process.env.PATH = originalPath;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('returns undefined when the CLI is not on PATH', () => {
    process.env.PATH = tmpDir;

    assert.strictEqual(resolveCLIPath(), undefined);
  });

  test('finds the CLI on PATH', () => {
    const cli = writeExecutable(tmpDir);
    process.env.PATH = tmpDir;

    assert.strictEqual(resolveCLIPath(), cli);
  });

  test('returns the first match, which is how spawn resolves it', () => {
    // Mirrors the case behind NV-4873: the extension-managed copy is prepended
    // to PATH and wins over a CLI the user installed elsewhere.
    const managed = path.join(tmpDir, 'managed');
    const system = path.join(tmpDir, 'system');
    fs.mkdirSync(managed);
    fs.mkdirSync(system);
    const managedCli = writeExecutable(managed);
    writeExecutable(system);
    process.env.PATH = [managed, system].join(path.delimiter);

    assert.strictEqual(resolveCLIPath(), managedCli);
  });

  test('finds a CLI in a directory whose name contains a space', () => {
    // The common Windows case: C:\Program Files\Nightvision\bin.
    const spaced = path.join(tmpDir, 'Program Files', 'Nightvision', 'bin');
    fs.mkdirSync(spaced, { recursive: true });
    const cli = writeExecutable(spaced);
    process.env.PATH = spaced;

    assert.strictEqual(resolveCLIPath(), cli);
  });

  test('skips empty PATH entries', () => {
    const cli = writeExecutable(tmpDir);
    process.env.PATH = ['', tmpDir].join(path.delimiter);

    assert.strictEqual(resolveCLIPath(), cli);
  });
});
