import { Project } from '@types_/project';
import { ApiSpec, TargetType, TargetTypeEnum } from '@types_/target';
import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  CREATE_TARGET,
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_OPENAPI_EXT,
  INVALID_OPENAPI_FILE,
  INVALID_URL,
} from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export interface CreateTargetParams {
  project: Project;
  targetName: string;
  targetUrl: string;
  type: TargetType;
  apiSpecType: ApiSpec;
  openApiUrl?: string;
  swaggerFilePath?: string | null;
  excludedUrlPatterns?: string[];
  excludedXPaths?: string[];
}

export default class CreateTarget extends Command {
  protected targetName: string;
  protected targetUrl: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    {
      project,
      targetName,
      targetUrl,
      type,
      apiSpecType,
      openApiUrl,
      swaggerFilePath,
      excludedUrlPatterns,
      excludedXPaths,
    }: CreateTargetParams
  ) {
    const flags: Flag[] = [
      { flag: '-P', value: project.id },
      { flag: '-t', value: type === TargetTypeEnum.URL ? 'WEB' : 'API' },
    ];

    if (type === TargetTypeEnum.OPENAPI) {
      flags.push({
        flag: apiSpecType === 'FILE' ? '-f' : '-s',
        value: (apiSpecType === 'FILE' ? swaggerFilePath : openApiUrl) ?? '',
      });
    }

    excludedUrlPatterns?.forEach(urlPattern => flags.push({
      flag: '--exclude-url',
      value: urlPattern,
    }));

    if (type === TargetTypeEnum.URL) {
      excludedXPaths?.forEach(xPath => flags.push({
        flag: '--exclude-xpath',
        value: xPath,
      }));
    }

    super({
      command: `${NIGHTVISION} target create ${targetName} ${targetUrl}`,
      webview: webview,
      requestId: requestId,
      flags: flags,
    });

    this.targetName = targetName;
    this.targetUrl = targetUrl;
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_TARGET,
        requestId: this.requestId,
        payload: {
          id: message.match(/^Id:\s*(.*)/)[1],
          name: this.targetName,
          url: this.targetUrl,
        },
      });
    } else if (/name.*already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
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
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    } else if (
      /Enter a valid URL/.test(message) ||
      /location: This field may not be blank/.test(message) ||
      /ERROR Invalid URL/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    }
  }
}
