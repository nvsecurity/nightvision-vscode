import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LOGIN } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';
import { resolveApiUrl } from '@utils/resolveApiUrl';

export default class Login extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super({
      command: `${NIGHTVISION} login`,
      webview: webview,
      requestId: requestId,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (/Only one usage of each socket address/.test(message)) {
      try {
        vscode.env.openExternal(vscode.Uri.parse(
          `${resolveApiUrl()}/api/v1/auth/cli/social`
        ));
      } catch (err) {
        console.error('Failed to open the link.');
      }
    }
  }

  handleClose(code: number | null, signal: string | null) {
    if (code === 0) {
      this.webview.postMessage({
        command: LOGIN,
        requestId: this.requestId,
      });
    }
    super.handleClose(code, signal);
  }
}
