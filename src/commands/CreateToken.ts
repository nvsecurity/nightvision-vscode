import * as vscode from 'vscode';
import Command from '@commands/Command';
import { CREATE_TOKEN } from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export default class CreateToken extends Command {
  protected extensionContext: vscode.ExtensionContext;
  protected nightvisionToken: { value: string };

  constructor(
    webview: vscode.Webview,
    requestId: string,
    extensionContext: vscode.ExtensionContext,
    nightvisionToken: { value: string }
  ) {
    super({
      command: `${NIGHTVISION} token create`,
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

    if (/^\S{64}$/.test(message.trim())) {
      const token = message.trim().match(/^\S{64}$/)?.[0] ?? '';
      this.nightvisionToken.value = token;

      const storedTokens =
        this.extensionContext.globalState.get<string>('tokens');
      const tokens: string[] = storedTokens ? JSON.parse(storedTokens) : [];
      const currentToken = token.slice(0, 8);
      tokens.push(currentToken);
      this.extensionContext.globalState.update(
        'tokens',
        JSON.stringify(tokens)
      );

      this.webview.postMessage({
        command: CREATE_TOKEN,
        requestId: this.requestId,
        payload: { tokens: tokens, currentToken: currentToken },
      });
    }
  }
}
