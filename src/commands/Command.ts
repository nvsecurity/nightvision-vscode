import * as cp from 'child_process';
import * as vscode from 'vscode';
import { EXIT, UNAUTHORIZED_ACCESS } from '@commands/CommandConstants';

export interface Flag {
  flag: string;
  value?: string;
}

export default class Command {
  protected command: string;
  protected webview: vscode.Webview;
  protected requestId: string;
  protected flags?: Flag[];
  protected stop: boolean;

  constructor(
    command: string,
    webview: vscode.Webview,
    requestId: string,
    flags?: Flag[],
    stop?: boolean
  ) {
    this.command = command;
    this.webview = webview;
    this.requestId = requestId;
    this.flags = flags;
    this.stop = stop ?? false;
  }

  execute() {
    if (this.stop) {
      this.webview.postMessage({
        requestId: this.requestId,
        isFinal: true,
      });
      return;
    }

    const flags = this.flags?.reduce<string[]>((acc, item) => {
      acc.push(item.flag);
      if (item.value) {
        acc.push(item.value.trim());
      }
      return acc;
    }, []);

    const [cmd, ...args] = this.command.split(' ');
    const child = cp.spawn(cmd, [
      ...args.map((arg) => (arg === '' ? ' ' : arg)),
      ...(flags ?? []),
    ]);

    child.stdout.on('data', (data) => this.handleOutput(data));
    child.stderr.on('data', (data) => this.handleOutput(data));
    child.on('close', (code, signal) => {
      this.handleClose(code, signal);
    });
    child.on('error', (err) => {
      this.handleError(err);
    });

    return child;
  }

  handleOutput(data: any) {
    console.log(data.toString());
  }

  handleClose(code: number | null, signal: string | null) {
    this.cleanup();
    this.webview.postMessage({
      command: EXIT,
      requestId: this.requestId,
      payload: { code, signal },
      isFinal: true,
    });
  }

  handleError(err: Error) {
    console.error(err);
  }

  cleanup() {}

  isLoggedIn(message: string) {
    if (
      /Please try to log in again by running `nightvision login`/.test(message)
    ) {
      this.webview.postMessage({
        command: UNAUTHORIZED_ACCESS,
        requestId: this.requestId,
        isFinal: true,
      });
      return false;
    }
    return true;
  }
}
