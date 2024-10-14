import * as vscode from 'vscode';
import { TargetInfo } from '@types_/target';
import Command from '@commands/Command';
import {
  DELETE_TARGET,
  INVALID_TARGET,
  INVALID_UUID,
} from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export interface DeleteTargetParams {
  id: string;
  target: TargetInfo;
}

export default class DeleteTarget extends Command {
  protected id: string;
  protected target: TargetInfo;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { id, target }: DeleteTargetParams
  ) {
    super({
      command: `${NIGHTVISION} target delete ${target.name}`,
      webview: webview,
      requestId: requestId,
    });
    this.id = id;
    this.target = target;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Target deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_TARGET,
        requestId: this.requestId,
        payload: {
          id: this.id,
        },
      });
    } else if (
      /This TARGET does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_TARGET,
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
