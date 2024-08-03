import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  DELETE_TARGET,
  INVALID_TARGET,
  INVALID_UUID,
} from '@commands/CommandConstants';

export interface DeleteTargetParams {
  id: string;
}

export default class DeleteTarget extends Command {
  protected id: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id }: DeleteTargetParams
  ) {
    super(`nightvision target delete -T ${id}`, webview, requestId);
    this.id = id;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Target deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_TARGET,
        requestId: this.requestId,
        payload: {
          id: this.id,
        },
      });
    } else if (
      /This TARGET does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_TARGET,
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
