import * as cp from 'child_process';
import * as vscode from 'vscode';
import Command from '@commands/Command';

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
        command: 'invalid-application',
        requestId: this.requestId,
      });
    } else if (/INFO Scan Details/.test(message)) {
      this.webview.postMessage({
        command: 'scan-id',
        requestId: this.requestId,
        payload: message.match(/Scan ID: (.*)/)[1],
      });
    } else if (/INFO New Issue detected/.test(message)) {
      this.webview.postMessage({
        command: 'issues',
        requestId: this.requestId,
        payload: [
          ...message.matchAll(/name=['"](.*)['"]\s+severity=(.*)\s+total.*/g),
        ].map((i) => {
          return { name: i[1], severity: i[2] };
        }),
      });
    } else if (/error validating target location/.test(message)) {
      this.webview.postMessage({
        command: 'invalid-target',
        requestId: this.requestId,
      });
    } else if (/target connectivity test failed/.test(message)) {
      this.webview.postMessage({
        command: 'invalid-target',
        requestId: this.requestId,
      });
    }
  }
}
