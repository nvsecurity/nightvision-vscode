import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CHECK_HEALTH } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

// Used to check if the user is logged in
export default class HealthCheck extends Command {
  protected extensionContext: vscode.ExtensionContext;
  protected nightvisionToken: { value: string };

  constructor(
    webview: vscode.Webview,
    requestId: string,
    extensionContext: vscode.ExtensionContext,
    nightvisionToken: { value: string }
  ) {
    super({
      command: `${NIGHTVISION} project show`,
      webview: webview,
      requestId: requestId,
      timeoutMs: 20_000,
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
