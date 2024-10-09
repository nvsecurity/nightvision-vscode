import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  CREATE_PROJECT,
  DUPLICATE_NAME,
  INVALID_NAME,
} from '@commands/CommandConstants';

export interface CreateProjectParams {
  projectName: string;
}

export default class CreateProject extends Command {
  protected projectName: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { projectName }: CreateProjectParams
  ) {
    const flags: Flag[] = [];
    super({
      command: `nightvision project create ${projectName}`,
      webview: webview,
      requestId: requestId,
      flags: flags,
    });
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
        payload: { id: message.match(/Id:\s*(.*)/)[1], name: this.projectName },
      });
    } else if (/name.*already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    }
  }
}
