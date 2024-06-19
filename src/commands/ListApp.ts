import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LIST_APP } from '@commands/CommandConstants';

export default class ListApp extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision app list', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();
    console.log(data.toString());

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Number:/.test(message)) {
      this.webview.postMessage({
        command: LIST_APP,
        requestId: this.requestId,
        payload: [...message.matchAll(/^Name:\s*(.*)/gm)].map((i) => i[1]),
      });
    }
  }
}
