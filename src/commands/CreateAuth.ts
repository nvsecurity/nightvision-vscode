import { AuthHeader, AuthType } from '@types_/auth';
import { Project } from '@types_/project';
import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  AUTH_DESCRIPTION_LENGTH,
  AUTH_MISSING_HEADERS,
  CREATE_AUTH,
  DUPLICATE_NAME,
  INVALID_AUTH_FORM,
  INVALID_NAME,
  INVALID_URL,
} from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

export interface CreateAuthParams {
  project: Project;
  name: string;
  type: AuthType;
  description?: string | null;
  headers?: AuthHeader[] | null;
  url?: string | null;
}

export default class CreateAuth extends Command {
  constructor(
    webview: vscode.Webview,
    requestId: string,
    { project, name, type, description, headers, url }: CreateAuthParams
  ) {
    let stop = false;

    if (!name.trim()) {
      webview.postMessage({
        command: INVALID_NAME,
        requestId: requestId,
      });
      stop = true;
    }

    const flags: Flag[] = [
      { flag: '-P', value: project.id },
    ];

    if (description) {
      flags.push({ flag: '-d', value: description });
    }

    if (type !== 'SCRIPT' && headers) {
      if (headers.some((header) => !header.name || !header.value)) {
        webview.postMessage({
          command: AUTH_MISSING_HEADERS,
          requestId: requestId,
        });
        stop = true;
      }

      for (const header of headers) {
        flags.push({ flag: '-H', value: `${header.name}:${header.value}` });
      }
    }

    var cmd = `${NIGHTVISION} auth ${type === 'COOKIE' ? 'cookies' : type === 'HEADER' ? 'headers' : 'playwright'} create ${name}`;
    if (type === 'SCRIPT' && url) {
      cmd += ` ${url}`;
    }

    super({
      command: cmd,
      webview: webview,
      requestId: requestId,
      flags: flags,
      stop: stop,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: CREATE_AUTH,
        requestId: this.requestId,
      });
    } else if (
      /ERROR name should have a max length/.test(message) ||
      /name: This field may not be blank/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    } else if (/already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
        requestId: this.requestId,
      });
    } else if (/failed JSON schema/.test(message)) {
      this.webview.postMessage({
        command: AUTH_MISSING_HEADERS,
        requestId: this.requestId,
      });
    } else if (/description.*500 characters/.test(message)) {
      this.webview.postMessage({
        command: AUTH_DESCRIPTION_LENGTH,
        requestId: this.requestId,
      });
    } else if (
      /ERROR Playwright stderr/.test(message) ||
      /"url" not set/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    } else if (/No filled form fields detected/.test(message)) {
      this.webview.postMessage({
        command: INVALID_AUTH_FORM,
        requestId: this.requestId,
      });
    }
  }
}
