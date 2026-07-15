import * as assert from 'assert';
import fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import SwaggerExtract from '../../commands/SwaggerExtract';
import { SWAGGER_EXTRACT_ERROR } from '../../commands/CommandConstants';

// Minimal mock for vscode.Webview
const mockWebview = {
  postMessage: () => Promise.resolve(true),
  html: '',
  options: {},
  onDidReceiveMessage: () => ({ dispose: () => {} }),
  cspSource: '',
  asWebviewUri: (uri: any) => uri,
} as any;

function hasFlag(instance: any, flag: string, value?: string): boolean {
  return instance.flags.some((f: any) =>
    f.flag === flag && (value === undefined || f.value === value)
  );
}

suite('SwaggerExtract', () => {
  test('should store the specified language', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'php',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.strictEqual(instance.language, 'php');
  });

  test('should generate filename with json extension when format is json', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-api',
      language: 'java',
      verbose: false,
      fileFormat: 'json',
    });

    const instance = cmd as any;
    assert.ok(instance.fileName.endsWith('.json'));
  });

  test('should pass correct flags for language, output, and no-upload', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'go',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(hasFlag(instance, '--lang', 'go'));
    assert.ok(hasFlag(instance, '--no-upload'));
  });

  test('should include verbose flag when verbose is true', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'python',
      verbose: true,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(hasFlag(instance, '--verbose'));
  });

  test('should not include verbose flag when verbose is false', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'ruby',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(!hasFlag(instance, '--verbose'));
  });

  test('should include file-format flag when format is specified', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'csharp',
      verbose: false,
      fileFormat: 'json',
    });

    const instance = cmd as any;
    assert.ok(hasFlag(instance, '--file-format', 'json'));
  });

  test('should omit --lang flag when language is "all"', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'all',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(!hasFlag(instance, '--lang'));
  });

  test('should omit --lang flag when language is empty', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: '',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(!hasFlag(instance, '--lang'));
  });

  test('should handle paths with spaces correctly', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my project/api server',
      language: 'java',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(hasFlag(instance, '/home/user/my project/api server'));
  });

  test('should remove the temp file when reading it fails', async function () {
    // Relies on POSIX permission semantics to make readFile fail while
    // access succeeds; meaningless on Windows or as root.
    if (process.platform === 'win32' || process.getuid?.() === 0) {
      this.skip();
    }

    const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), 'nv-swagger-test-'));
    const messages: any[] = [];
    const webview = {
      ...mockWebview,
      postMessage: (message: any) => {
        messages.push(message);
        return Promise.resolve(true);
      },
    };

    const cmd = new SwaggerExtract(webview, 'test-request-id', {
      dirPath,
      language: 'java',
      verbose: false,
      fileFormat: '',
    });
    const tempFile = path.join(dirPath, (cmd as any).fileName);

    try {
      await fs.writeFile(tempFile, 'openapi: 3.0.0\n', { mode: 0o000 });

      await cmd.handleClose();

      assert.ok(messages.some(m => m.command === SWAGGER_EXTRACT_ERROR));
      await assert.rejects(fs.access(tempFile), 'temp file should be removed');
    } finally {
      await fs.rm(dirPath, { recursive: true, force: true });
    }
  });
});
