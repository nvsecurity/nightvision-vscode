import * as vscode from 'vscode';
import Command from '@commands/Command';
import { LIST_TARGET } from '@commands/CommandConstants';

export default class ListTarget extends Command {
  protected ids: string[];
  protected names: string[];
  protected urls: string[];

  constructor(webview: vscode.Webview, requestId: string) {
    super('nightvision target list', webview, requestId);
    this.ids = [];
    this.names = [];
    this.urls = [];
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (
      /Id:/.test(message) ||
      /Name:/.test(message) ||
      /Location:/.test(message)
    ) {
      this.ids = [
        ...this.ids,
        ...[...message.matchAll(/^Id:\s*(.*)/gm)].map((i) => i[1]),
      ];
      this.names = [
        ...this.names,
        ...[...message.matchAll(/^Name:\s*(.*)/gm)].map((i) => i[1]),
      ];
      this.urls = [
        ...this.urls,
        ...[...message.matchAll(/^Location:\s*(.*)/gm)].map((i) => i[1]),
      ];
    }
  }

  cleanup() {
    const targets = this.ids.map((id, index) => ({
      id,
      name: this.names[index],
      url: this.urls[index],
    }));

    this.webview.postMessage({
      command: LIST_TARGET,
      requestId: this.requestId,
      payload: targets,
    });
  }
}
