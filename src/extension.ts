import { ChildProcessWithoutNullStreams } from 'child_process';
import os from 'os';
import { join } from 'path';
import path from 'path';
import sudo from 'sudo-prompt';
import * as vscode from 'vscode';
import { ExtensionContext, ExtensionMode, Uri } from 'vscode';
import CliVersion from '@commands/CliVersion';
import {
  CHECK_HEALTH,
  ADD_CLI_TO_VSCODE_PATH,
  CLI_INSTALL,
  CLI_INSTALL_FAILED,
  CLI_VERSION,
  CREATE_AUTH,
  CREATE_PROJECT,
  CREATE_TARGET,
  CREATE_TOKEN,
  DELETE_AUTH,
  DELETE_PROJECT,
  DELETE_TARGET,
  DELETE_TOKENS,
  GET_CURRENT_PROJECT,
  GET_CURRENT_TARGET,
  KILL,
  LOGIN,
  LOGOUT,
  OPEN_FILE_DIALOG,
  SAVE_CURRENT_PROJECT,
  SAVE_CURRENT_TARGET,
  SCAN,
  SWAGGER_EXTRACT,
  UPDATE_AUTH,
  UPDATE_PROJECT,
  UPDATE_TARGET,
  VALIDATE_FILE_PATH,
} from '@commands/CommandConstants';
import CreateAuth from '@commands/CreateAuth';
import CreateProject from '@commands/CreateProject';
import CreateTarget from '@commands/CreateTarget';
import CreateToken from '@commands/CreateToken';
import DeleteAuth from '@commands/DeleteAuth';
import DeleteProject from '@commands/DeleteProject';
import DeleteTarget from '@commands/DeleteTarget';
import GetCurrentProject from '@commands/GetCurrentProject';
import Login from '@commands/Login';
import Logout from '@commands/Logout';
import SaveCurrentProject from '@commands/SaveCurrentProject';
import Scan from '@commands/Scan';
import UpdateAuth from '@commands/UpdateAuth';
import UpdateProject from '@commands/UpdateProject';
import UpdateTarget from '@commands/UpdateTarget';
import fs from 'fs/promises';
import { openFileDialog } from '@commands/OpenFileDialog';
import SwaggerExtract from '@commands/SwaggerExtract';
import FilePathValidator from '@commands/FilePathValidator';
import GetTokensList from '@commands/GetTokensList';
import { installNightvisionCLI, putCLIToVSCodePath } from '@commands/InstallNightvisionCLI';

export async function activate(context: vscode.ExtensionContext) {
  const sidebarProvider = new SidebarProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'nightvision-sidebar',
      sidebarProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );
}

export function deactivate() { }
class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _children: { [key: string]: ChildProcessWithoutNullStreams | undefined };
  nightvisionToken: { value: string };

  constructor(private readonly _extensionContext: ExtensionContext) {
    this._children = {};
    this.nightvisionToken = { value: '' };
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
            body: JSON.stringify(body),
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Token ${this.nightvisionToken.value}`,
            },
          });

          if (response.headers.get('Content-Length') === '0') {
            webviewView.webview.postMessage({
              requestId,
            });
            return;
          }

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
            error: err instanceof Error ? err.message : JSON.stringify(err),
          });
        }
        return;
      }

      try {
        switch (command) {
          case CLI_INSTALL: {
            const readyToProceed = await installNightvisionCLI(payload.isUpdateCLI);
            if (readyToProceed) {
              webviewView.webview.postMessage({
                command: CLI_INSTALL,
                requestId,
                isFinal: true,
              });
            } else {
              webviewView.webview.postMessage({
                command: CLI_INSTALL_FAILED,
                requestId,
                isFinal: true,
              });
            }
            break;
          }
          case CLI_VERSION: {
            const command = new CliVersion(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case ADD_CLI_TO_VSCODE_PATH: {
            putCLIToVSCodePath();
            webviewView.webview.postMessage({
              command: ADD_CLI_TO_VSCODE_PATH,
              requestId,
              isFinal: true,
            });
            break;
          }
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
            const command = new Scan(webviewView.webview, requestId, payload);

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_AUTH: {
            const command = new CreateAuth(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_AUTH: {
            const command = new DeleteAuth(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case UPDATE_AUTH: {
            const command = new UpdateAuth(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_PROJECT: {
            const command = new CreateProject(
              webviewView.webview,
              requestId,
              payload
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
            const command = new DeleteProject(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case UPDATE_PROJECT: {
            const command = new UpdateProject(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case SAVE_CURRENT_PROJECT: {
            const command = new SaveCurrentProject(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_TARGET: {
            const command = new CreateTarget(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_TARGET: {
            const command = new DeleteTarget(
              webviewView.webview,
              requestId,
              payload
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
          case UPDATE_TARGET: {
            const command = new UpdateTarget(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case LOGIN: {
            const command = new Login(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case LOGOUT: {
            const command = new Logout(webviewView.webview, requestId);

            this._children[requestId] = command.execute();
            break;
          }
          case CREATE_TOKEN: {
            const command = new CreateToken(
              webviewView.webview,
              requestId,
              this._extensionContext,
              this.nightvisionToken
            );

            this._children[requestId] = command.execute();
            break;
          }
          case DELETE_TOKENS: {
            const storedTokens =
              this._extensionContext.globalState.get<string>('tokens');
            const tokens: string[] = storedTokens
              ? JSON.parse(storedTokens)
              : [];

            const newTokens = tokens.filter(
              (token) =>
                !payload.some((deleteToken: string) => token === deleteToken)
            );

            this._extensionContext.globalState.update(
              'tokens',
              JSON.stringify(newTokens)
            );

            webviewView.webview.postMessage({
              command: DELETE_TOKENS,
              requestId,
              isFinal: true,
            });
            break;
          }
          case CHECK_HEALTH: {
            const command = new GetTokensList(
              webviewView.webview,
              requestId,
              this._extensionContext,
              this.nightvisionToken
            );

            this._children[requestId] = command.execute();
            break;
          }
          case OPEN_FILE_DIALOG: {
            const selectedPaths = await openFileDialog(payload);

            webviewView.webview.postMessage({
              command: OPEN_FILE_DIALOG,
              requestId,
              payload: { selectedPaths: selectedPaths },
              isFinal: true,
            });
            break;
          }
          case SWAGGER_EXTRACT: {
            const command = new SwaggerExtract(
              webviewView.webview,
              requestId,
              payload
            );

            this._children[requestId] = command.execute();
            break;
          }
          case VALIDATE_FILE_PATH: {
            const validator = new FilePathValidator(
              payload
            );

            const result = validator.validate();
            webviewView.webview.postMessage({
              command: VALIDATE_FILE_PATH,
              requestId,
              payload: result,
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
      <meta http-equiv="Content-Security-Policy" content="default-src *; img-src 'self' data: *; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
