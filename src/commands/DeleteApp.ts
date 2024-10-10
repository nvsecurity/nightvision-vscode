import * as vscode from 'vscode';
import { AppInfo } from '@types_/app';
import Command from '@commands/Command';
import {
  DELETE_APP,
  INVALID_APP,
  INVALID_APP_DELETE,
  INVALID_UUID,
} from '@commands/CommandConstants';

export interface DeleteAppParams {
  id: string;
  app: AppInfo;
}

export default class DeleteApp extends Command {
  protected id: string;
  protected app: AppInfo;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id, app }: DeleteAppParams
  ) {
    super({
      command: `nightvision app delete ${app.name}`,
      webview: webview,
      requestId: requestId,
    });
    this.id = id;
    this.app = app;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Application deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_APP,
        requestId: this.requestId,
        payload: {
          id: this.id,
          app: this.app,
        },
      });
    } else if (
      /This Application does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_APP,
        requestId: this.requestId,
      });
    } else if (/Cannot delete the current application/.test(message)) {
      this.webview.postMessage({
        command: INVALID_APP_DELETE,
        requestId: this.requestId,
      });
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    }
  }
}
