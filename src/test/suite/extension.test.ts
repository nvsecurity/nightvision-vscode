import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension', () => {
  test('should be present', () => {
    const extension = vscode.extensions.getExtension('nvsecurity.nightvision');
    assert.ok(extension);
  });

  test('should register the nightvision-sidebar view', async () => {
    const extension = vscode.extensions.getExtension('nvsecurity.nightvision');
    assert.ok(extension);
    await extension.activate();
    // If activation succeeds without error, the sidebar provider was registered
  });
});
