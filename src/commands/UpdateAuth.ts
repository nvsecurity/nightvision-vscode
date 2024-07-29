import { Auth, AuthHeader } from '@types_/auth';
import { Project } from '@types_/project';
import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  AUTH_DESCRIPTION_LENGTH,
  AUTH_MISSING_HEADERS,
  DUPLICATE_NAME,
  INVALID_AUTH,
  INVALID_AUTH_FORM,
  INVALID_NAME,
  INVALID_URL,
  INVALID_UUID,
  NO_UPDATED_FIELD,
  UPDATE_AUTH,
} from '@commands/CommandConstants';

export interface UpdateAuthParams {
  project: Project;
  authentication: Auth;
  name: string;
  // description?: string | null;
  headers?: AuthHeader[] | null;
  url?: string | null;
  rerecord?: boolean;
}

export default class UpdateAuth extends Command {
  protected authentication: Auth;
  protected headers: AuthHeader[];
  protected url: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    {
      project,
      authentication,
      name,
      // description,
      headers,
      url,
      rerecord,
    }: UpdateAuthParams
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
      { flag: '-C', value: authentication.id },
    ];

    // nightvision auth playwright update returns a duplicate
    // name error if you give it the same name
    if (name !== authentication.name && !rerecord) {
      flags.push({ flag: '-n', value: name });
    }

    // CLI won't take empty descriptions
    // Using API instead
    // if (!rerecord) {
    //   flags.push({ flag: '-d', value: description || ' ' });
    // }

    if (authentication.type !== 'SCRIPT' && headers) {
      for (const header of headers) {
        flags.push({ flag: '-H', value: `${header.name}:${header.value}` });
      }
    }

    if (
      authentication.type === 'SCRIPT' &&
      url &&
      (url !== authentication.url || rerecord)
    ) {
      flags.push({ flag: '-u', value: url });
    }

    super(
      `nightvision auth ${authentication.type === 'COOKIE' ? 'cookies' : authentication.type === 'HEADER' ? 'headers' : 'playwright'} update`,
      webview,
      requestId,
      flags,
      stop
    );

    this.authentication = authentication;
    this.headers = headers ?? [];
    this.url = url ?? '';
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Updated playwright script/.test(message)) {
      this.webview.postMessage({
        command: UPDATE_AUTH,
        requestId: this.requestId,
        payload: {
          ...this.authentication,
        },
      });
    } else if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: UPDATE_AUTH,
        requestId: this.requestId,
        payload: {
          id: this.authentication.id,
          name: message.match(/Name:\s*(.*)/)[1],
          type: this.authentication.type,
          headers: this.headers,
          description: message.match(/Description:\s*(.*)/)[1],
          url: this.url,
        },
      });
    } else if (/does not exist or is not shared with you/.test(message)) {
      this.webview.postMessage({
        command: INVALID_AUTH,
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
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    } else if (/Enter a valid URL/.test(message)) {
      this.webview.postMessage({
        command: INVALID_URL,
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
    } else if (/ERROR Playwright stderr/.test(message)) {
      this.webview.postMessage({
        command: INVALID_URL,
        requestId: this.requestId,
      });
    } else if (/No filled form fields detected/.test(message)) {
      this.webview.postMessage({
        command: INVALID_AUTH_FORM,
        requestId: this.requestId,
      });
    } else if (/one update field required/.test(message)) {
      this.webview.postMessage({
        command: NO_UPDATED_FIELD,
        requestId: this.requestId,
      });
    }
  }
}
