import { ChildProcessWithoutNullStreams } from 'child_process';
import { join } from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri } from 'vscode';
import {
  CREATE_APP,
  CREATE_PROJECT,
  CREATE_TARGET,
  DELETE_PROJECT,
  GET_CURRENT_APP,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  GET_SCANS,
  KILL,
  LIST_APP,
  LIST_PROJECT,
  LIST_TARGET,
  LOGIN,
  RENAME_PROJECT,
  SAVE_CURRENT_APP,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  SAVE_SCAN,
  SCAN,
} from '@commands/CommandConstants';
import CreateApp from '@commands/CreateApp';
import CreateProject from '@commands/CreateProject';
import CreateTarget from '@commands/CreateTarget';
import DeleteProject from '@commands/DeleteProject';
import GetCurrentApp from '@commands/GetCurrentApp';
import GetCurrentProject from '@commands/GetCurrentProject';
import ListApp from '@commands/ListApp';
import ListProject from '@commands/ListProject';
import ListTarget from '@commands/ListTarget';
import Login from '@commands/Login';
import RenameProject from '@commands/RenameProject';
import SaveCurrentApp from '@commands/SaveCurrentApp';
import SaveCurrentProject from '@commands/SaveCurrentProject';
import Scan from '@commands/Scan';

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

      try {
        switch (command) {
          case KILL: {
            this._children[requestId]?.kill('SIGINT');
            this._children[requestId]?.kill('SIGTERM');
            webviewView.webview.postMessage({
              command: KILL,
              requestId,
            });
            break;
          }
          case SCAN: {
            const { applicationName, targetName } = payload;

            const scanCommand = new Scan(
              webviewView.webview,
              requestId,
              applicationName,
              targetName
            );

            this._children[requestId] = scanCommand.execute();
            break;
          }
          case CREATE_APP: {
            const { applicationName } = payload;

            const createAppCommand = new CreateApp(
              webviewView.webview,
              requestId,
              applicationName
            );

            this._children[requestId] = createAppCommand.execute();
            break;
          }
          case GET_CURRENT_APP: {
            const getCurrentAppCommand = new GetCurrentApp(
              webviewView.webview,
              requestId
            );

            this._children[requestId] = getCurrentAppCommand.execute();
            break;
          }
          case SAVE_CURRENT_APP: {
            const { id, name } = payload;

            const saveCurrentAppCommand = new SaveCurrentApp(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = saveCurrentAppCommand.execute();
            break;
          }
          case LIST_APP: {
            const listAppCommand = new ListApp(webviewView.webview, requestId);

            this._children[requestId] = listAppCommand.execute();
            break;
          }
          case CREATE_PROJECT: {
            const { projectName } = payload;

            const createProjectCommand = new CreateProject(
              webviewView.webview,
              requestId,
              projectName
            );

            this._children[requestId] = createProjectCommand.execute();
            break;
          }
          case GET_CURRENT_PROJECT: {
            const getCurrentProjectCommand = new GetCurrentProject(
              webviewView.webview,
              requestId
            );

            this._children[requestId] = getCurrentProjectCommand.execute();
            break;
          }
          case DELETE_PROJECT: {
            const { id } = payload;
            const deleteProjectCommand = new DeleteProject(
              webviewView.webview,
              requestId,
              id
            );

            this._children[requestId] = deleteProjectCommand.execute();
            break;
          }
          case LIST_PROJECT: {
            const listProjectCommand = new ListProject(
              webviewView.webview,
              requestId
            );

            this._children[requestId] = listProjectCommand.execute();
            break;
          }
          case RENAME_PROJECT: {
            const { id, name } = payload;
            const renameProjectCommand = new RenameProject(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = renameProjectCommand.execute();
            break;
          }
          case SAVE_CURRENT_PROJECT: {
            const { id, name } = payload;

            const saveCurrentProjectCommand = new SaveCurrentProject(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = saveCurrentProjectCommand.execute();
            break;
          }
          case CREATE_TARGET: {
            const { targetName, targetUrl } = payload;

            const createTargetCommand = new CreateTarget(
              webviewView.webview,
              requestId,
              targetName,
              targetUrl
            );

            this._children[requestId] = createTargetCommand.execute();
            break;
          }
          case GET_CURRENT_TARGET: {
            const storedTarget =
              this._extensionContext.globalState.get<string>('target');
            const target = storedTarget ? JSON.parse(storedTarget) : {};

            webviewView.webview.postMessage({
              command: GET_CURRENT_TARGET,
              requestId,
              payload: target,
              isFinal: true,
            });
            break;
          }
          case SAVE_CURRENT_TARGET: {
            this._extensionContext.globalState.update(
              'target',
              JSON.stringify(payload)
            );

            webviewView.webview.postMessage({
              command: SAVE_CURRENT_TARGET,
              requestId,
              isFinal: true,
            });
            break;
          }
          case LIST_TARGET: {
            const listTargetCommand = new ListTarget(
              webviewView.webview,
              requestId
            );

            this._children[requestId] = listTargetCommand.execute();
            break;
          }
          case LOGIN: {
            const loginCommand = new Login(webviewView.webview, requestId);

            this._children[requestId] = loginCommand.execute();
            break;
          }
          case GET_SCANS: {
            const storedScans =
              this._extensionContext.globalState.get<string>('scans');
            const scans = storedScans ? JSON.parse(storedScans) : {};

            webviewView.webview.postMessage({
              command: GET_SCANS,
              requestId,
              payload: scans,
              isFinal: true,
            });
            break;
          }
          case SAVE_SCAN: {
            this._extensionContext.globalState.update(
              'scans',
              JSON.stringify(payload.scans)
            );

            webviewView.webview.postMessage({
              command: SAVE_SCAN,
              requestId,
              isFinal: true,
            });
            break;
          }
        }
      } catch (err) {
        webviewView.webview.postMessage({
          command,
          requestId,
          isFinal: true,
          error: err instanceof Error ? err.message : JSON.stringify(err),
        });
      }

      return;
    });
  }

  private _getHtmlForWebview(
    context: ExtensionContext,
    webview: vscode.Webview
  ) {
    const jsFile = 'webview.js';
    const localServerUrl = `http://localhost:${process.env.PORT}`;

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
