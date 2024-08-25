import { ApiSpec, TargetInfo, TargetType } from '@types_/target';
import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_OPENAPI_EXT,
  INVALID_OPENAPI_FILE,
  INVALID_TARGET,
  INVALID_URL,
  INVALID_UUID,
  UPDATE_TARGET,
} from '@commands/CommandConstants';

export interface UpdateTargetParams {
  targetId: string;
  newTargetName: string;
  newTargetUrl: string;
  target: TargetInfo;
  type: TargetType;
  apiSpecType: ApiSpec;
  openApiUrl?: string;
  swaggerFilePath?: string | null;
}

export default class UpdateTarget extends Command {
  protected targetId: string;
  protected newTargetName: string;
  protected newTargetUrl: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    {
      targetId,
      newTargetName,
      newTargetUrl,
      target,
      type,
      apiSpecType,
      openApiUrl,
      swaggerFilePath,
    }: UpdateTargetParams
  ) {
    const flags: Flag[] = [
      { flag: '-n', value: newTargetName },
      { flag: '-u', value: newTargetUrl },
    ];

    if (type === 'OPENAPI' && (openApiUrl || swaggerFilePath)) {
      flags.push({
        flag: apiSpecType === 'FILE' ? '-f' : '-s',
        value: (apiSpecType === 'FILE' ? swaggerFilePath : openApiUrl) ?? '',
      });
    }

    super(`nightvision target update ${target.name}`, webview, requestId, flags);

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
    } else if (/swagger specification.*must have a .yaml/.test(message)) {
      this.webview.postMessage({
        command: INVALID_OPENAPI_EXT,
        requestId: this.requestId,
      });
    } else if (
      /could not download swagger specification from provided url/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_OPENAPI_FILE,
        requestId: this.requestId,
      });
    } else if (/name.*already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
        requestId: this.requestId,
      });
    }
  }
}
