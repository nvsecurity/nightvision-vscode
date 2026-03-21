// Extension host only — do not import from webview code.
import * as vscode from 'vscode';

const SCHEME = 'nightvision';
const contentStore = new Map<string, string>();
let counter = 0;

export const specContentProvider: vscode.TextDocumentContentProvider = {
  provideTextDocumentContent(uri: vscode.Uri): string {
    return contentStore.get(uri.path) || '';
  }
};

export const SPEC_URI_SCHEME = SCHEME;

export function storeSpecContent(displayName: string, content: string): vscode.Uri {
  // Use a counter to ensure unique URIs across multiple extractions
  const key = `${++counter}-${displayName}`;
  contentStore.set(key, content);
  return vscode.Uri.from({ scheme: SCHEME, path: key });
}

export function removeSpecContent(uri: vscode.Uri): void {
  contentStore.delete(uri.path);
}
