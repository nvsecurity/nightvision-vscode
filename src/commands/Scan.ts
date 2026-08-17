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

// Cap on the CLI output kept for failure reporting. Only the tail is needed to
// explain why a scan never started, and the panel it is rendered into is narrow.
const OUTPUT_LIMIT = 2000;

export default class Scan extends Command {
  // Set once the CLI reports a scan id. Until then any exit is a failure to
  // start, which is what NV-4827 was: the CLI failed, matched none of the
  // patterns below, and the webview was told nothing at all.
  private scanStarted = false;
  // Set when a specific reason has already been posted (expired login,
  // unreachable target) so the generic failure below does not pile on top.
  private reportedFailure = false;
  private output = '';

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

    this.recordOutput(message);

    if (!this.isLoggedIn(message)) {
      // isLoggedIn has posted UNAUTHORIZED_ACCESS as the final message.
      this.reportedFailure = true;
      return;
    }

    if (/INFO Scan Details/.test(message)) {
      const scanId = message.match(/Scan ID: (.*)/);
      if (scanId) {
        this.scanStarted = true;
        this.webview.postMessage({
          command: SCAN_ID,
          requestId: this.requestId,
          payload: scanId[1].trim(),
        });
      }
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
      const status = message.match(/(?<!Login\s)Status:\s([^\n\r]+)/);
      if (status) {
        this.webview.postMessage({
          command: SCAN_FINISHED,
          requestId: this.requestId,
          payload: status[1],
        });
      }
    } else if (/target connectivity test failed/.test(message)) {
      this.reportedFailure = true;
      this.webview.postMessage({
        command: INVALID_TARGET,
        requestId: this.requestId,
        payload: 'target connectivity test failed',
      });
    }
  }

  handleClose(code: number | null, signal: string | null) {
    if (this.scanStarted || this.reportedFailure) {
      super.handleClose(code, signal);
      return;
    }

    // The CLI stopped without ever reporting a scan id and without saying
    // anything this class recognises. Surface its own output rather than
    // letting the request end silently.
    this.cleanup();
    this.webview.postMessage({
      requestId: this.requestId,
      error: this.failureMessage(code, signal),
      isFinal: true,
    });
  }

  private recordOutput(message: string) {
    if (this.scanStarted) {
      return;
    }
    this.output = (this.output + message).slice(-OUTPUT_LIMIT);
  }

  private failureMessage(code: number | null, signal: string | null): string {
    const reason = signal
      ? `The NightVision CLI was terminated by ${signal} before the scan started.`
      : `The NightVision CLI exited with code ${code ?? 'unknown'} without starting a scan.`;

    const output = this.output.trim();

    return output ? `${reason}\n\n${output}` : reason;
  }
}
