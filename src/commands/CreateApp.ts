import * as cp from 'child_process';
import * as vscode from 'vscode';
import Command from '@commands/Command';

export default class CreateApp extends Command {
  constructor(
    webview: vscode.Webview,
    requestId: string,
    applicationName: string
  ) {
    super(`nightvision app create -n ${applicationName}`, webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();
    console.log(data.toString());

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: 'created-app',
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: 'invalid-app-name',
        requestId: this.requestId,
      });
    }
  }
}
