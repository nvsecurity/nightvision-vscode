import * as vscode from 'vscode';
import Command from '@commands/Command';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import { SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR } from './CommandConstants';

export interface SwaggerExtractParams {
  path: string;
  language: string;
}

export interface SwaggerExtractSuccessResults {
  paths: number;
  classes: number;
}

export default class SwaggerExtract extends Command {
  protected path: string;
  protected language: string;
  private fileName: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { path, language }: SwaggerExtractParams
  ) {
    const fileName = `nv-swagger-${v4()}.yml`;
    super(`nightvision swagger extract ${path} --lang ${language} --no-upload --output ${fileName}`, webview, requestId, [], undefined, path, true);
    this.fileName = fileName;
    this.path = path;
    this.language = language;
  }

  async handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/ERROR error extracting API/.test(message)) {
      this.webview.postMessage({
        command: SWAGGER_EXTRACT_ERROR,
        requestId: this.requestId,
        isFinal: true,
      });
    } else if (/INFO Successfully validated the output/.test(message)) {
      const filePath = `${this.path}/${this.fileName}`;
      try {
        const { paths, classes } = this.getParsedResults(message);
        await this.processFile(filePath);

        this.webview.postMessage({
          command: SWAGGER_EXTRACT,
          requestId: this.requestId,
          payload: {
            paths: paths,
            classes: classes,
          } as SwaggerExtractSuccessResults,
          isFinal: true,
        });
      }
      catch (e) {
        this.webview.postMessage({
          command: SWAGGER_EXTRACT_ERROR,
          requestId: this.requestId,
          isFinal: true,
        });
      }
    }
  }

  private async processFile(filePath: string) {
    const data = await fs.readFile(filePath, 'utf8');

    const document = await vscode.workspace.openTextDocument({
      content: data,
      language: 'yaml',
    });
    await vscode.window.showTextDocument(document, { preview: false, });

    await fs.unlink(filePath);
  }

  private getParsedResults(message: string): { paths: number, classes: number } {
    const matchedPaths = message.match(/Number of discovered paths:\s*(.*)/);
    const paths = matchedPaths !== null ? Number(matchedPaths[1]) : 0;

    const matchedClasses = message.match(/Number of discovered classes:\s*(.*)/);
    const classes = matchedClasses !== null ? Number(matchedClasses[1]) : 0;

    return {
      paths: paths,
      classes: classes,
    };
  }
}
