import * as vscode from 'vscode';
import { ProjectInfo } from '@types_/project';
import Command from '@commands/Command';
import {
  DUPLICATE_NAME,
  INVALID_NAME,
  INVALID_PROJECT,
  INVALID_UUID,
  UPDATE_PROJECT,
} from '@commands/CommandConstants';

export interface UpdateProjectParams {
  projectId: string;
  newProjectName: string;
  project: ProjectInfo;
}

export default class UpdateProject extends Command {
  constructor(
    webview: vscode.Webview,
    requestId: string,
    { projectId, newProjectName, project }: UpdateProjectParams
  ) {
    super({
      command: `nightvision project update ${project.name} ${newProjectName}`,
      webview: webview,
      requestId: requestId,
    });
  }

  handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/Id:/.test(message)) {
      this.webview.postMessage({
        command: UPDATE_PROJECT,
        requestId: this.requestId,
        payload: {
          id: message.match(/Id:\s*(.*)/)[1],
          name: message.match(/Name:\s*(.*)/)[1],
        },
      });
    } else if (
      /This Project does not exist or is not shared with you/.test(message)
    ) {
      this.webview.postMessage({
        command: INVALID_PROJECT,
        requestId: this.requestId,
      });
    } else if (/ERROR name should have a max length/.test(message)) {
      this.webview.postMessage({
        command: INVALID_NAME,
        requestId: this.requestId,
      });
    } else if (/is not a valid UUID/.test(message)) {
      this.webview.postMessage({
        command: INVALID_UUID,
        requestId: this.requestId,
      });
    } else if (/name.*already exists/.test(message)) {
      this.webview.postMessage({
        command: DUPLICATE_NAME,
        requestId: this.requestId,
      });
    }
  }
}
