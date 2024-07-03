import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  CREATE_PROJECT,
  INVALID_PROJECT_NAME,
} from '@commands/CommandConstants';

export default class CreateProject extends Command {
  protected projectName: string;

  constructor(webview: vscode.Webview, requestId: string, projectName: string) {
    super(`nightvision project create -n ${projectName}`, webview, requestId);
    this.projectName = projectName;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_PROJECT,
        requestId: this.requestId,
        payload: this.projectName,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_PROJECT_NAME,
        requestId: this.requestId,
      });
    }
  }
}
