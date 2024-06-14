import { ChildProcessWithoutNullStreams } from 'child_process';
import { join } from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri } from 'vscode';
import Command from '@commands/Command';

export function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'nightvision-sidebar',
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate() {}
class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _children: { [key: string]: ChildProcessWithoutNullStreams };

  constructor(private readonly _extensionContext: ExtensionContext) {
    this._children = {};
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionContext.extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(
      this._extensionContext,
      webviewView.webview
    );

    webviewView.webview.onDidReceiveMessage((data) => {
      const {
        command,
        requestId,
        payload,
      }: { command: string; requestId: string; payload: any } = data;

      switch (command) {
        case 'kill': {
          this._children[requestId]?.kill();
          webviewView.webview.postMessage({
            requestId,
            isFinal: true,
          });
          break;
        }
        case 'scan': {
          const { applicationName, targetName } = payload;

          const scanCommand = new Command(
            `nightvision scan -a ${applicationName} -t ${targetName}`,
            webviewView.webview,
            requestId
          );

          scanCommand.handleStdout = (data) => {
            const message = data.toString();

            if (/Application .* does not exist within project/.test(message)) {
              webviewView.webview.postMessage({
                command: 'invalid-application',
                requestId,
              });
            }
          };

          scanCommand.handleStderr = (data) => {
            const message = data.toString();

            if (/INFO Scan Details/.test(message)) {
              webviewView.webview.postMessage({
                command: 'scan-id',
                requestId,
                payload: message.match(/Scan ID: (.*)/)[1],
              });
            } else if (/INFO New Issue detected/.test(message)) {
              webviewView.webview.postMessage({
                command: 'issues',
                requestId,
                payload: [
                  ...message.matchAll(
                    /name=['"](.*)['"]\s+severity=(.*)\s+total.*/g
                  ),
                ].map((i) => {
                  return { name: i[1], severity: i[2] };
                }),
              });
            } else if (/error validating target location/.test(message)) {
              webviewView.webview.postMessage({
                command: 'invalid-target',
                requestId,
              });
            } else if (/target connectivity test failed/.test(message)) {
              webviewView.webview.postMessage({
                command: 'invalid-target',
                requestId,
              });
            }
          };

          this._children[requestId] = scanCommand.execute();
          break;
        }
      }
      return;
    });
  }

  private _getHtmlForWebview(
    context: ExtensionContext,
    webview: vscode.Webview
  ) {
    const jsFile = 'webview.js';
    const localServerUrl = 'http://localhost:9000';

    let scriptUrl = null;

    const isProduction = context.extensionMode === ExtensionMode.Production;
    if (isProduction) {
      scriptUrl = webview
        .asWebviewUri(Uri.file(join(context.extensionPath, 'dist', jsFile)))
        .toString();
    } else {
      scriptUrl = `${localServerUrl}/${jsFile}`;
    }

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUrl}"></script>
      <script nonce="${nonce}">
        const vscodeApi = acquireVsCodeApi();
      </script>
    </body>
    </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
