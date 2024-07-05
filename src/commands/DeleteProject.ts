import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  DELETE_PROJECT,
  INVALID_PROJECT,
  INVALID_PROJECT_DELETE,
  INVALID_UUID,
} from '@commands/CommandConstants';

export default class DeleteProject extends Command {
  protected id: string;

  constructor(webview: vscode.Webview, requestId: string, id: string) {
    super(`nightvision project delete -P ${id}`, webview, requestId);
    this.id = id;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Project deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_PROJECT,
        requestId: this.requestId,
        payload: {
          id: this.id,
        },
      });
    } else if (
      /This Project does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_PROJECT,
        requestId: this.requestId,
      });
    } else if (/Cannot delete the current project/.test(message)) {
      this.webview.postMessage({
        command: INVALID_PROJECT_DELETE,
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
