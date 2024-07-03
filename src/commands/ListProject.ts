import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LIST_PROJECT } from '@commands/CommandConstants';

export default class ListProject extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision project list', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Number:/.test(message)) {
      this.webview.postMessage({
        command: LIST_PROJECT,
        requestId: this.requestId,
        payload: [...message.matchAll(/^Name:\s*(.*)/gm)].map((i) => i[1]),
      });
    }
  }
}
