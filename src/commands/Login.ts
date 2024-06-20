import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LOGIN } from '@commands/CommandConstants';

export default class Login extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision login', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (/Authentication token saved to file system/.test(message)) {
      this.webview.postMessage({
        command: LOGIN,
        requestId: this.requestId,
      });
    } else if (/Only one usage of each socket address/.test(message)) {
      const url = vscode.Uri.parse(
        'https://api.nightvision.net/api/v1/auth/cli/social'
      );

      try {
        vscode.env.openExternal(url);
      } catch (err) {
        console.error('Failed to open the link.');
      }
    }
  }
}
