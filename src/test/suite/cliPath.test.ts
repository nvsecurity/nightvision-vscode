import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { resolveCLIPath } from '../../commands/InstallNightvisionCLI';

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

  test('finds the CLI on PATH', function () {
    // The executable-name and permission handling below is POSIX-specific.
    if (process.platform === 'win32') {
      this.skip();
    }

    const cli = path.join(tmpDir, 'nightvision');
    fs.writeFileSync(cli, '#!/bin/sh\n', { mode: 0o755 });
    process.env.PATH = tmpDir;

    assert.strictEqual(resolveCLIPath(), cli);
  });

  test('returns the first match, which is how spawn resolves it', function () {
    if (process.platform === 'win32') {
      this.skip();
    }

    // Mirrors the case behind NV-4873: the extension-managed copy is prepended
    // to PATH and wins over a CLI the user installed elsewhere.
    const managed = path.join(tmpDir, 'managed');
    const system = path.join(tmpDir, 'system');
    fs.mkdirSync(managed);
    fs.mkdirSync(system);
    fs.writeFileSync(path.join(managed, 'nightvision'), '#!/bin/sh\n', { mode: 0o755 });
    fs.writeFileSync(path.join(system, 'nightvision'), '#!/bin/sh\n', { mode: 0o755 });
    process.env.PATH = [managed, system].join(path.delimiter);

    assert.strictEqual(resolveCLIPath(), path.join(managed, 'nightvision'));
  });

  test('skips empty PATH entries', function () {
    if (process.platform === 'win32') {
      this.skip();
    }

    const cli = path.join(tmpDir, 'nightvision');
    fs.writeFileSync(cli, '#!/bin/sh\n', { mode: 0o755 });
    process.env.PATH = ['', tmpDir].join(path.delimiter);

    assert.strictEqual(resolveCLIPath(), cli);
  });
});
