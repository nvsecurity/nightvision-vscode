import { ChildProcessWithoutNullStreams } from 'child_process';
import os from 'os';
import { join } from 'path';
import path from 'path';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri } from 'vscode';
import {
  CREATE_APP,
  CREATE_PROJECT,
  CREATE_TARGET,
  DELETE_APP,
  DELETE_PROJECT,
  DELETE_TARGET,
  GET_CURRENT_APP,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  GET_NIGHTVISION_TOKEN,
  KILL,
  LIST_APP,
  LIST_PROJECT,
  LIST_TARGET,
  LOGIN,
  SAVE_CURRENT_APP,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  SCAN,
  UPDATE_APP,
  UPDATE_PROJECT,
  UPDATE_TARGET,
} from '@commands/CommandConstants';
import CreateApp from '@commands/CreateApp';
import CreateProject from '@commands/CreateProject';
import CreateTarget from '@commands/CreateTarget';
import DeleteApp from '@commands/DeleteApp';
import DeleteProject from '@commands/DeleteProject';
import DeleteTarget from '@commands/DeleteTarget';
import GetCurrentApp from '@commands/GetCurrentApp';
import GetCurrentProject from '@commands/GetCurrentProject';
import ListApp from '@commands/ListApp';
import ListProject from '@commands/ListProject';
import ListTarget from '@commands/ListTarget';
import Login from '@commands/Login';
import SaveCurrentApp from '@commands/SaveCurrentApp';
import SaveCurrentProject from '@commands/SaveCurrentProject';
import Scan from '@commands/Scan';
import UpdateApp from '@commands/UpdateApp';
import UpdateProject from '@commands/UpdateProject';
import UpdateTarget from '@commands/UpdateTarget';
import fs from 'fs/promises';

const getNightVisionToken = async () => {
  try {
    const filePath = path.join(os.homedir(), '.nightvision', 'nightvision.yml');
    const data = await fs.readFile(filePath, 'utf8');
    const token = data.match(/token:\s*(.*)/);
    return token?.at(1) ?? '';
  } catch (err) {
    console.error(err);
  }
  return '';
};

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(
    context,
    await getNightVisionToken()
  );

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
  nightvisionToken: string;

  constructor(
    private readonly _extensionContext: ExtensionContext,
    nightvisionToken: string
  ) {
    this._children = {};
    this.nightvisionToken = nightvisionToken;
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

    webviewView.webview.onDidReceiveMessage(async (data) => {
      const {
        command,
        requestId,
        payload,
        url,
        method,
        body,
      }: {
        command: string;
        requestId: string;
        payload: any;
        url: string;
        method: RequestInit['method'];
        body: RequestInit['body'];
      } = data;

      if (url) {
        try {
          const response = await fetch(url, {
            method,
            body,
            headers: {
              accept: 'application/json',
              Authorization: `Token ${this.nightvisionToken}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw data;
          }

          webviewView.webview.postMessage({
            requestId,
            payload: data,
          });
        } catch (err) {
          webviewView.webview.postMessage({
            requestId,
            error: err,
          });
        }
        return;
      }

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
            const { application, target } = payload;

            const command = new Scan(
              webviewView.webview,
              requestId,
              application,
              target
            );

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_APP: {
            const { applicationName } = payload;

            const command = new CreateApp(
              webviewView.webview,
              requestId,
              applicationName
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_APP: {
            const { id } = payload;

            const command = new DeleteApp(webviewView.webview, requestId, id);

            this._children[requestId] = command.execute();
            break;
          }
          case GET_CURRENT_APP: {
            const command = new GetCurrentApp(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case SAVE_CURRENT_APP: {
            const { id, name } = payload;

            const command = new SaveCurrentApp(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = command.execute();
            break;
          }
          case LIST_APP: {
            const command = new ListApp(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case UPDATE_APP: {
            const { id, name } = payload;
            const command = new UpdateApp(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_PROJECT: {
            const { projectName } = payload;

            const command = new CreateProject(
              webviewView.webview,
              requestId,
              projectName
            );

            this._children[requestId] = command.execute();
            break;
          }
          case GET_CURRENT_PROJECT: {
            const command = new GetCurrentProject(
              webviewView.webview,
              requestId
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_PROJECT: {
            const { id } = payload;
            const command = new DeleteProject(
              webviewView.webview,
              requestId,
              id
            );

            this._children[requestId] = command.execute();
            break;
          }
          case LIST_PROJECT: {
            const command = new ListProject(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case UPDATE_PROJECT: {
            const { id, name } = payload;
            const command = new UpdateProject(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = command.execute();
            break;
          }
          case SAVE_CURRENT_PROJECT: {
            const { id, name } = payload;

            const command = new SaveCurrentProject(
              webviewView.webview,
              requestId,
              id,
              name
            );

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_TARGET: {
            const { targetName, targetUrl } = payload;

            const command = new CreateTarget(
              webviewView.webview,
              requestId,
              targetName,
              targetUrl
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_TARGET: {
            const { id } = payload;

            const command = new DeleteTarget(
              webviewView.webview,
              requestId,
              id
            );

            this._children[requestId] = command.execute();
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
            const command = new ListTarget(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case UPDATE_TARGET: {
            const { id, name, url } = payload;

            const command = new UpdateTarget(
              webviewView.webview,
              requestId,
              id,
              name,
              url
            );

            this._children[requestId] = command.execute();
            break;
          }
          case LOGIN: {
            const command = new Login(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case GET_NIGHTVISION_TOKEN: {
            this.nightvisionToken = await getNightVisionToken();
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
