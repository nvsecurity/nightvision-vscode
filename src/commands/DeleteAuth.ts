import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  DELETE_AUTH,
  INVALID_AUTH,
  INVALID_UUID,
} from '@commands/CommandConstants';

export default class DeleteAuth extends Command {
  protected id: string;

  constructor(webview: vscode.Webview, requestId: string, id: string) {
    super(`nightvision auth delete -C ${id}`, webview, requestId);
    this.id = id;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_AUTH,
        requestId: this.requestId,
        payload: {
          id: this.id,
        },
      });
    } else if (/does not exist or is not shared with you/.test(message)) {
      this.webview.postMessage({
        command: INVALID_AUTH,
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
