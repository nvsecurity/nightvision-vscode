import * as cp from 'child_process';
import * as vscode from 'vscode';
import {
  CLI_MISSING,
  EXIT,
  UNAUTHORIZED_ACCESS,
} from '@commands/CommandConstants';

export interface Flag {
  flag: string;
  value?: string;
}

interface CommandParams {
  command: string;
  webview: vscode.Webview;
  requestId: string;
  flags?: Flag[];
  stop?: boolean;
  cwd?: string;
  async?: boolean;
}

export default class Command {
  protected command: string;
  protected webview: vscode.Webview;
  protected requestId: string;
  protected flags?: Flag[];
  protected stop: boolean;
  protected cwd?: string;
  protected async: boolean;

  constructor({
    command, webview, requestId,
    flags, stop, cwd,
    async,
  }: CommandParams) {
    this.command = command;
    this.webview = webview;
    this.requestId = requestId;
    this.flags = flags;
    this.stop = stop ?? false;
    this.cwd = cwd;
    this.async = async || false;
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
      acc.push(item.value?.trim() || '');
      return acc;
    }, []);

    const [cmd, ...args] = this.command.split(' ');
    const child = cp.spawn(cmd, [
      ...args.map((arg) => (arg === '' ? ' ' : arg)),
      ...(flags ?? []),
    ], { cwd: this.cwd });

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
      // to allow async operations inside handlers without closing connection
      // if `async` is provided, the `isFinal` state is managed within the handlers
      isFinal: !this.async,
    });
  }

  handleError(err: NodeJS.ErrnoException) {
    if (err.code === 'ENOENT') {
      this.webview.postMessage({
        command: CLI_MISSING,
        requestId: this.requestId,
        isFinal: true,
      });
    }
    console.error(err);
  }

  cleanup() { }

  isLoggedIn(message: string) {
    if (
      /Please try to log in again by running `nightvision login`/.test(
        message
      ) ||
      /ERROR error logging in to API err=": You do not have permission to perform this action.."/.test(
        message
      ) ||
      /ERROR unkown error occurred err=": You do not have permission to perform this action.."/.test(
        message
      )
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
