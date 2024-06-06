import * as cp from 'child_process';
import * as vscode from 'vscode';

export default class Command {
  protected command: string;
  protected webview: vscode.Webview;
  protected requestId: string;

  constructor(command: string, webview: vscode.Webview, requestId: string) {
    this.command = command;
    this.webview = webview;
    this.requestId = requestId;
  }

  execute() {
    const [cmd, ...args] = this.command.split(' ');
    const child = cp.spawn(cmd, args, { cwd: 'C:/Users/Sean' });

    child.stdout.on('data', (data) => this.handleStdout(data));
    child.stderr.on('data', (data) => this.handleStderr(data));
    child.on('exit', (code, signal) => {
      this.handleExit(code, signal);
    });
    child.on('error', (err) => {
      this.handleError(err);
    });

    return child;
  }

  handleStdout(data: any) {
    console.log(data.toString());
  }

  handleStderr(data: any) {
    console.log(data.toString());
    if (
      /Please try to log in again by running `nightvision login`/.test(
        data.toString()
      )
    ) {
      this.webview.postMessage({
        command: 'unauthorized-access',
        requestId: this.requestId,
        isFinal: true,
      });
    }
  }

  handleExit(code: number | null, signal: string | null) {
    this.webview.postMessage({
      command: 'exit',
      requestId: this.requestId,
      payload: { code, signal },
      isFinal: true,
    });
  }

  handleError(err: Error) {
    console.error(err);
  }
}
