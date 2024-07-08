import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  CREATE_TARGET,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_URL,
} from '@commands/CommandConstants';

export default class CreateTarget extends Command {
  protected targetName: string;
  protected targetUrl: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    targetName: string,
    targetUrl: string
  ) {
    super(
      `nightvision target create -n ${targetName} -u ${targetUrl}`,
      webview,
      requestId
    );
    this.targetName = targetName;
    this.targetUrl = targetUrl;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_TARGET,
        requestId: this.requestId,
        payload: {
          id: message.match(/^Id:\s*(.*)/)[1],
          name: this.targetName,
          url: this.targetUrl,
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
    } else if (
      /Enter a valid URL/.test(message) ||
      /location: This field may not be blank/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    }
  }
}
