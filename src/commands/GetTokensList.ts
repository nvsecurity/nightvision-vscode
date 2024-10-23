import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CHECK_HEALTH } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export default class GetTokensList extends Command {
  protected extensionContext: vscode.ExtensionContext;
  protected nightvisionToken: { value: string };

  constructor(
    webview: vscode.Webview,
    requestId: string,
    extensionContext: vscode.ExtensionContext,
    nightvisionToken: { value: string }
  ) {
    super({
      command: `${NIGHTVISION} token list`,
      webview: webview,
      requestId: requestId,
    });

    this.extensionContext = extensionContext;
    this.nightvisionToken = nightvisionToken;
  }

  handleOutput(data: any) {
    const message: string = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    this.webview.postMessage({
      command: CHECK_HEALTH,
      requestId: this.requestId,
    });
  }
}
