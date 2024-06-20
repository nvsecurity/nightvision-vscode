import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  CREATE_TARGET,
  DUPLICATE_TARGET,
  INVALID_TARGET_NAME,
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
    console.log(message);

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_TARGET,
        requestId: this.requestId,
        payload: { targetName: this.targetName, targetUrl: this.targetUrl },
      });
    } else if (/already exists in the Project/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_TARGET,
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_TARGET_NAME,
        requestId: this.requestId,
      });
    } else if (/Enter a valid URL/.test(message)) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    }
  }
}
