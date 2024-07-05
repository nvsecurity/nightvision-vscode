import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LIST_PROJECT } from '@commands/CommandConstants';

export default class ListProject extends Command {
  protected ids: string[];
  protected names: string[];

  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision project list', webview, requestId);
    this.ids = [];
    this.names = [];
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message) || /Name:/.test(message)) {
      this.ids = [
        ...this.ids,
        ...[...message.matchAll(/^Id:\s*(.*)/gm)].map((i) => i[1]),
      ];
      this.names = [
        ...this.names,
        ...[...message.matchAll(/^Name:\s*(.*)/gm)].map((i) => i[1]),
      ];
    }
  }

  cleanup() {
    const projects = this.ids.map((id, index) => ({
      id,
      name: this.names[index],
    }));

    this.webview.postMessage({
      command: LIST_PROJECT,
      requestId: this.requestId,
      payload: projects,
    });
  }
}
