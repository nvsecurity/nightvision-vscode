import * as vscode from 'vscode';
import Command from '@commands/Command';
import { GET_CURRENT_PROJECT } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export default class GetCurrentProject extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super({
      command: `${NIGHTVISION} project show`,
      webview: webview,
      requestId: requestId,
      timeoutMs: 20_000,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: GET_CURRENT_PROJECT,
        requestId: this.requestId,
        payload: {
          id: message.match(/Id:\s*(.*)/)[1],
          name: message.match(/Name:\s*(.*)/)[1],
        },
      });
    }
  }
}
