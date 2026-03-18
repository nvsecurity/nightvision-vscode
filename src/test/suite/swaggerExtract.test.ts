import * as assert from 'assert';
import SwaggerExtract from '../../commands/SwaggerExtract';

// Minimal mock for vscode.Webview
const mockWebview = {
  postMessage: () => Promise.resolve(true),
  html: '',
  options: {},
  onDidReceiveMessage: () => ({ dispose: () => {} }),
  cspSource: '',
  asWebviewUri: (uri: any) => uri,
} as any;

suite('SwaggerExtract', () => {
  test('should store the specified language', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'php',
      verbose: false,
      fileFormat: '',
    });

    // Access protected fields via type assertion
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

  test('should build correct CLI command with language flag', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'go',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(instance.command.includes('--lang go'));
    assert.ok(instance.command.includes('--no-upload'));
  });

  test('should include verbose flag when verbose is true', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'python',
      verbose: true,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(instance.command.includes('--verbose'));
  });

  test('should not include verbose flag when verbose is false', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'ruby',
      verbose: false,
      fileFormat: '',
    });

    const instance = cmd as any;
    assert.ok(!instance.command.includes('--verbose'));
  });

  test('should include file-format flag when format is specified', () => {
    const cmd = new SwaggerExtract(mockWebview, 'test-request-id', {
      dirPath: '/home/user/my-project',
      language: 'csharp',
      verbose: false,
      fileFormat: 'json',
    });

    const instance = cmd as any;
    assert.ok(instance.command.includes('--file-format json'));
  });

});
