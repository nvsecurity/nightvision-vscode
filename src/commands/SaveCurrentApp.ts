import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  INVALID_APP,
  INVALID_UUID,
  SAVE_CURRENT_APP,
} from '@commands/CommandConstants';

export interface SaveCurrentAppParams {
  id: string;
  name: string;
}

export default class SaveCurrentApp extends Command {
  protected id: string;
  protected name: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id, name }: SaveCurrentAppParams
  ) {
    super({
      command: `nightvision app set ${name}`,
      webview: webview,
      requestId: requestId,
    });

    this.id = id;
    this.name = name;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Current project changed/.test(message)) {
      this.webview.postMessage({
        command: SAVE_CURRENT_APP,
        requestId: this.requestId,
        payload: { id: this.id, name: this.name },
      });
    } else if (
      /This Application does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_APP,
        requestId: this.requestId,
      });
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    }
  }
}
