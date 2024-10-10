import * as vscode from 'vscode';
import { AppInfo } from '@types_/app';
import Command from '@commands/Command';
import {
  DUPLICATE_NAME,
  INVALID_APP,
  INVALID_NAME,
  INVALID_UUID,
  UPDATE_APP,
} from '@commands/CommandConstants';

export interface UpdateAppParams {
  appId: string;
  newAppName: string;
  app: AppInfo;
}

export default class UpdateApp extends Command {
  protected appId: string;
  protected newAppName: string;
  protected app: AppInfo;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { appId, newAppName, app }: UpdateAppParams
  ) {
    super({
      command: `nightvision app update ${app.name} ${newAppName}`,
      webview: webview,
      requestId: requestId,
    });

    this.appId = appId;
    this.newAppName = newAppName;
    this.app = app;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: UPDATE_APP,
        requestId: this.requestId,
        payload: {
          id: this.appId,
          name: this.newAppName,
        },
      });
    } else if (
      /This Application does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_APP,
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    } else if (/name.*already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
        requestId: this.requestId,
      });
    }
  }
}
