import * as vscode from 'vscode';
import { AuthInfo } from '@types_/auth';
import Command from '@commands/Command';
import {
  DELETE_AUTH,
  INVALID_AUTH,
  INVALID_UUID,
} from '@commands/CommandConstants';

export interface DeleteAuthParams {
  authId: string;
  auth: AuthInfo;
}

export default class DeleteAuth extends Command {
  protected id: string;
  protected auth: AuthInfo;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { authId, auth }: DeleteAuthParams
  ) {
    super(`nightvision auth delete ${auth.name}`, webview, requestId);
    this.id = authId;
    this.auth = auth;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/deleted successfully/.test(message)) {
      this.webview.postMessage({
        command: DELETE_AUTH,
        requestId: this.requestId,
        payload: {
          id: this.id,
        },
      });
    } else if (/does not exist or is not shared with you/.test(message)) {
      this.webview.postMessage({
        command: INVALID_AUTH,
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
