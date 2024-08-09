import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CLI_VERSION } from '@commands/CommandConstants';

export default class CliVersion extends Command {
  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision version', webview, requestId);
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (/(\d+\.\d+\.\d+)/.test(message)) {
      this.webview.postMessage({
        command: CLI_VERSION,
        requestId: this.requestId,
        payload: { version: message.match(/(\d+\.\d+\.\d+)/)[1] },
      });
    }
  }
}
