import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  INVALID_NAME,
  INVALID_TARGET,
  INVALID_URL,
  INVALID_UUID,
  UPDATE_TARGET,
} from '@commands/CommandConstants';

export default class UpdateTarget extends Command {
  protected targetId: string;
  protected newTargetName: string;
  protected newTargetUrl: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    targetId: string,
    newTargetName: string,
    newTargetUrl: string
  ) {
    super(
      `nightvision target update -T ${targetId} -n ${newTargetName} -u ${newTargetUrl}`,
      webview,
      requestId
    );

    this.targetId = targetId;
    this.newTargetName = newTargetName;
    this.newTargetUrl = newTargetUrl;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: UPDATE_TARGET,
        requestId: this.requestId,
        payload: {
          id: this.targetId,
          name: this.newTargetName,
          url: this.newTargetUrl,
        },
      });
    } else if (
      /This Target does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_TARGET,
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    } else if (
      /Enter a valid URL/.test(message) ||
      /location: This field may not be blank/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    }
  }
}
