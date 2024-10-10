import { Auth } from '@types_/auth';
import { Project } from '@types_/project';
import { Target } from '@types_/target';
import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import {
  INVALID_TARGET,
  ISSUES,
  SCAN_FINISHED,
  SCAN_ID,
} from '@commands/CommandConstants';

export interface ScanParams {
  project: Project;
  target: Target;
  authentication?: Auth | null;
}

export default class Scan extends Command {
  constructor(
    webview: vscode.Webview,
    requestId: string,
    { project, target, authentication }: ScanParams
  ) {
    const flags: Flag[] = [
      { flag: '-P', value: project.id },
    ];

    if (authentication) {
      flags.push({ flag: '-C', value: authentication.id });
    }

    const cmd = `nightvision scan ${target.name}`;

    super({
      command: cmd,
      webview: webview,
      requestId: requestId,
      flags: flags,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/INFO Scan Details/.test(message)) {
      this.webview.postMessage({
        command: SCAN_ID,
        requestId: this.requestId,
        payload: message.match(/Scan ID: (.*)/)[1],
      });
    } else if (/INFO New Issue detected/.test(message)) {
      this.webview.postMessage({
        command: ISSUES,
        requestId: this.requestId,
        payload: [
          ...message.matchAll(/name=['"](.*)['"]\s+severity=(.*)\s+total.*/g),
        ].map((i) => {
          return { name: i[1], severity: i[2].toLowerCase() };
        }),
      });
    } else if (/INFO Scan Finished/.test(message)) {
      this.webview.postMessage({
        command: SCAN_FINISHED,
        requestId: this.requestId,
        payload: message.match(/(?<!Login\s)Status:\s([^\n\r]+)/)[1],
      });
    } else if (/error validating target location/.test(message)) {
      this.webview.postMessage({
        command: INVALID_TARGET,
        requestId: this.requestId,
        payload: 'error validating target location',
      });
    } else if (/target connectivity test failed/.test(message)) {
      this.webview.postMessage({
        command: INVALID_TARGET,
        requestId: this.requestId,
        payload: 'target connectivity test failed',
      });
    }
  }
}
