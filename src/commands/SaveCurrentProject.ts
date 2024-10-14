import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  INVALID_PROJECT,
  INVALID_UUID,
  SAVE_CURRENT_PROJECT,
} from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export interface SaveCurrentProjectParams {
  id: string;
  name: string;
}

export default class SaveCurrentProject extends Command {
  protected id: string;
  protected name: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id, name }: SaveCurrentProjectParams
  ) {
    super({
      command: `${NIGHTVISION} project set ${name}`,
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
        command: SAVE_CURRENT_PROJECT,
        requestId: this.requestId,
        payload: { id: this.id, name: this.name },
      });
    } else if (
      /This Project does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_PROJECT,
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
