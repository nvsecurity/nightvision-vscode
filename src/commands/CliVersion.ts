import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CLI_VERSION } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export default class CliVersion extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super({
      command: `${NIGHTVISION} version`,
      webview: webview,
      requestId: requestId,
      timeoutMs: 20_000,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();
    const match = message.match(/Version\s+(\d+\.\d+\.\d+)/);
    if (match) {
      this.webview.postMessage({
        command: CLI_VERSION,
        requestId: this.requestId,
        payload: { version: match[1] },
      });
    }
  }
}
