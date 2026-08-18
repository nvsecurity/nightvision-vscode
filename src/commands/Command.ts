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
  timeoutMs?: number;
}

export default class Command {
  protected command: string;
  protected webview: vscode.Webview;
  protected requestId: string;
  protected flags?: Flag[];
  protected stop: boolean;
  protected cwd?: string;
  protected async: boolean;
  protected timeoutMs?: number;
  protected didTimeout = false;
  private timeoutHandle?: NodeJS.Timeout;
  private child?: cp.ChildProcess;

  constructor({
    command, webview, requestId,
    flags, stop, cwd,
    async, timeoutMs,
  }: CommandParams) {
    this.command = command;
    this.webview = webview;
    this.requestId = requestId;
    this.flags = flags;
    this.stop = stop ?? false;
    this.cwd = cwd;
    this.async = async || false;
    this.timeoutMs = timeoutMs;
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
      if (item.value != null) {
        acc.push(item.value.trim());
      }
      return acc;
    }, []);

    const [cmd, ...args] = this.command.split(' ');
    const child = cp.spawn(cmd, [
      ...args.map((arg) => (arg === '' ? ' ' : arg)),
      ...(flags ?? []),
    ], { cwd: this.cwd });

    this.child = child;

    if (this.timeoutMs && this.timeoutMs > 0) {
      this.timeoutHandle = setTimeout(() => {
        this.didTimeout = true;
        this.killChild();
        this.handleTimeout();
      }, this.timeoutMs);
    }

    child.stdout.on('data', (data) => {
      if (this.didTimeout) return;
      this.handleOutput(data);
    });
    child.stderr.on('data', (data) => {
      if (this.didTimeout) return;
      this.handleOutput(data);
    });
    child.on('close', (code, signal) => {
      this.cancelTimeout();
      if (this.didTimeout) return;
      this.handleClose(code, signal);
    });
    child.on('error', (err) => {
      this.cancelTimeout();
      if (this.didTimeout) return;
      this.handleError(err);
    });

    return child;
  }

  // Stops the deadline without stopping the command. A subclass calls this once
  // the output proves the command is making progress, so the timeout can cover
  // just the part of the run that is expected to be quick.
  protected cancelTimeout() {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
  }

  protected killChild() {
    try {
      this.child?.kill();
    } catch {
      /* ignore */
    }
  }

  protected handleTimeout() {
    this.cleanup();
    const seconds = Math.round((this.timeoutMs ?? 0) / 1000);
    const message = `\`${this.command}\` did not respond within ${seconds} seconds and was terminated.`;
    this.webview.postMessage({
      requestId: this.requestId,
      error: message,
      isFinal: true,
    });
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
    console.error(err);
    if (err.code === 'ENOENT' || err.code === 'EACCES') {
      this.webview.postMessage({
        command: CLI_MISSING,
        requestId: this.requestId,
        isFinal: true,
      });
      return;
    }
    // For any other spawn error, surface it instead of hanging the consumer.
    this.webview.postMessage({
      requestId: this.requestId,
      error: `\`${this.command}\` failed to start: ${err.message || err.code || 'unknown error'}`,
      isFinal: true,
    });
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
