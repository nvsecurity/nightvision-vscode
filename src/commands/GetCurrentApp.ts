import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  APP_NOT_FOUND,
  APP_NOT_SET,
  GET_CURRENT_APP,
} from '@commands/CommandConstants';

export default class GetCurrentApp extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision app show', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: GET_CURRENT_APP,
        requestId: this.requestId,
        payload: {
          id: message.match(/Id:\s*(.*)/)[1],
          name: message.match(/Name:\s*(.*)/)[1],
        },
      });
    } else if (
      /does not exist, not under your active Project or not shared with you/.test(
        message
      )
    ) {
      this.webview.postMessage({
        command: APP_NOT_FOUND,
        requestId: this.requestId,
      });
    } else if (/No application set/.test(message)) {
      this.webview.postMessage({
        command: APP_NOT_SET,
        requestId: this.requestId,
      });
    }
  }
}
