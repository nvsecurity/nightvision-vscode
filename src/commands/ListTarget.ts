import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LIST_TARGET } from '@commands/CommandConstants';

export default class ListTarget extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision target list', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();
    console.log(message);

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Number:/.test(message)) {
      this.webview.postMessage({
        command: LIST_TARGET,
        requestId: this.requestId,
        // Can't put into { targetName, targetUrl}[] since
        // message is sometimes split into multiple ouputs.
        payload: {
          targetNames: [...message.matchAll(/^Name:\s*(.*)/gm)].map(
            (i) => i[1]
          ),
          targetUrls: [...message.matchAll(/^Location:\s*(.*)/gm)].map(
            (i) => i[1]
          ),
        },
      });
    }
  }
}
