import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CURRENT_PROJECT } from '@commands/CommandConstants';

export default class CurrentProject extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision project show', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Name:/.test(message)) {
      this.webview.postMessage({
        command: CURRENT_PROJECT,
        requestId: this.requestId,
        payload: message.match(/Name:\s*(.*)/)[1],
      });
    }
  }
}
