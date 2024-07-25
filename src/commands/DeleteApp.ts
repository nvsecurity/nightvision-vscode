import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  DELETE_APP,
  INVALID_APP,
  INVALID_APP_DELETE,
  INVALID_UUID,
} from '@commands/CommandConstants';

export interface DeleteAppParams {
  id: string;
}

export default class DeleteApp extends Command {
  protected id: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id }: DeleteAppParams
  ) {
    super(`nightvision app delete -A ${id}`, webview, requestId);
    this.id = id;
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
