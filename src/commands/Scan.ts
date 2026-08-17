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
  TARGET_CONNECTIVITY_STARTED,
} from '@commands/CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';

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
      // The target name is a positional argument, but it goes through `flags`
      // because Command splits the command string on spaces (NV-4200).
      { flag: target.name },
      { flag: '-P', value: project.id },
    ];

    if (authentication) {
      flags.push({ flag: '-C', value: authentication.id });
    }

    super({
      command: `${NIGHTVISION} scan`,
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
    } else if (/INFO Target connectivity test: starting TCP connection/.test(message)) {
      this.webview.postMessage({
        command: TARGET_CONNECTIVITY_STARTED,
        requestId: this.requestId,
        payload: 'Target connectivity test: starting TCP connection',
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
