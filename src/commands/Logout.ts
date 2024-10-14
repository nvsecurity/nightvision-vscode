import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LOGOUT } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export default class Logout extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super({
      command: `${NIGHTVISION} logout`,
      webview: webview,
      requestId: requestId,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (/logged out successfully/.test(message)) {
      this.webview.postMessage({
        command: LOGOUT,
        requestId: this.requestId,
      });
    }
  }
}
