import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  CREATE_APP,
  DUPLICATE_NAME,
  INVALID_NAME,
} from '@commands/CommandConstants';

export interface CreateAppParams {
  applicationName: string;
}

export default class CreateApp extends Command {
  protected applicationName: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { applicationName }: CreateAppParams
  ) {
    super({
      command: `nightvision app create ${applicationName}`,
      webview: webview,
      requestId: requestId,
    });
    this.applicationName = applicationName;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_APP,
        requestId: this.requestId,
        payload: {
          id: message.match(/Id:\s*(.*)/)[1],
          name: this.applicationName,
        },
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
