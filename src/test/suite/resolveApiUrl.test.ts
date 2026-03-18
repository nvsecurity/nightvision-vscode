import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { resolveApiUrl } from '../../utils/resolveApiUrl';

suite('resolveApiUrl', () => {
  let tmpDir: string;
  let configPath: string;
  let originalEnv: string | undefined;

  setup(() => {
    originalEnv = process.env.NIGHTVISION_API_URL;
    delete process.env.NIGHTVISION_API_URL;

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nv-test-'));
    configPath = path.join(tmpDir, 'nightvision.yml');
  });

  teardown(() => {
    if (originalEnv !== undefined) {
      process.env.NIGHTVISION_API_URL = originalEnv;
    } else {
      delete process.env.NIGHTVISION_API_URL;
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should return default URL when no env var or config exists', () => {
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.nightvision.net');
  });

  test('should prefer env var over config file', () => {
    process.env.NIGHTVISION_API_URL = 'https://api.custom.example.com/api/v1/';
    fs.writeFileSync(configPath, 'api-url: https://api.test.nightvision.net/api/v1/\n');
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.custom.example.com');
  });

  test('should read from config file when env var is not set', () => {
    fs.writeFileSync(configPath, 'api-url: https://api.test.nightvision.net/api/v1/\n');
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.test.nightvision.net');
  });

  test('should strip /api/v1/ suffix from env var', () => {
    process.env.NIGHTVISION_API_URL = 'https://api.nightvision.net/api/v1/';
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.nightvision.net');
  });

  test('should strip /api/v1 suffix without trailing slash', () => {
    process.env.NIGHTVISION_API_URL = 'https://api.nightvision.net/api/v1';
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.nightvision.net');
  });

  test('should strip trailing slash from URL without /api/v1', () => {
    process.env.NIGHTVISION_API_URL = 'https://api.nightvision.net/';
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.nightvision.net');
  });

  test('should return URL unchanged when no suffix to strip', () => {
    process.env.NIGHTVISION_API_URL = 'https://api.nightvision.net';
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.nightvision.net');
  });

  test('should handle config file with other fields', () => {
    fs.writeFileSync(configPath, [
      'format: text',
      'api-url: https://api.staging.nightvision.net/api/v1/',
      'token: abc123',
    ].join('\n'));
    const url = resolveApiUrl(configPath);
    assert.strictEqual(url, 'https://api.staging.nightvision.net');
  });
});
