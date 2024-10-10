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
  private extractedPaths: number;
  private extractedClasses: number;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { path, language }: SwaggerExtractParams
  ) {
    const fileName = `nv-swagger-${v4()}.yml`;
    super({
      command: `nightvision swagger extract ${path} --lang ${language} --no-upload --output ${fileName}`,
      webview: webview,
      requestId: requestId,
      cwd: path,
      async: true
    });
    this.fileName = fileName;
    this.path = path;
    this.language = language;
    this.extractedPaths = 0;
    this.extractedClasses = 0;
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
    } else if (/INFO Generated the OpenAPI document/.test(message)) {
      const filePath = `${this.path}/${this.fileName}`;
      try {
        this.parseResults(message);
        await this.processFile(filePath);

        this.webview.postMessage({
          command: SWAGGER_EXTRACT,
          requestId: this.requestId,
          payload: {
            paths: this.extractedPaths,
            classes: this.extractedClasses,
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
    } else if (/Number of discovered paths:/.test(message)) {
      this.parseResults(message);
    } else if (/Number of discovered classes:/.test(message)) {
      this.parseResults(message);
    }
  }

  private async processFile(filePath: string) {
    const data = await fs.readFile(filePath, 'utf8');

    const document = await vscode.workspace.openTextDocument({
      content: data,
      language: 'yaml',
    });
    await vscode.window.showTextDocument(document, { preview: false, });

    await fs.rm(filePath, { force: true });
  }

  private parseResults(message: string) {
    const matchedPaths = message.match(/Number of discovered paths:\s*(.*)/);
    const paths = matchedPaths !== null ? Number(matchedPaths[1]) : this.extractedPaths;
    this.extractedPaths = paths;

    const matchedClasses = message.match(/Number of discovered classes:\s*(.*)/);
    const classes = matchedClasses !== null ? Number(matchedClasses[1]) : this.extractedClasses;
    this.extractedClasses = classes;
  }
}
