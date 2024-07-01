import * as vscode from 'vscode';
import Command from '@commands/Command';
import {
  INVALID_APP,
  INVALID_TARGET,
  ISSUES,
  SCAN_FINISHED,
  SCAN_ID,
} from '@commands/CommandConstants';

export default class Scan extends Command {
  constructor(
    webview: vscode.Webview,
    requestId: string,
    applicationName: string,
    targetName: string
  ) {
    super(
      `nightvision scan -a ${applicationName} -t ${targetName}`,
      webview,
      requestId
    );
  }

  handleOutput(data: any) {
    const message = data.toString();
    console.log(data.toString());

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Application .* does not exist within project/.test(message)) {
      this.webview.postMessage({
        command: INVALID_APP,
        requestId: this.requestId,
      });
    } else if (/INFO Scan Details/.test(message)) {
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
      });
    } else if (/target connectivity test failed/.test(message)) {
      this.webview.postMessage({
        command: INVALID_TARGET,
        requestId: this.requestId,
      });
    }
  }
}
