import * as vscode from 'vscode';
import Command from '@commands/Command';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import { SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR } from './CommandConstants';

export interface SwaggerExtractParams {
  dirPath: string;
  language: string;
}

export interface SwaggerExtractSuccessResults {
  paths: number;
  classes: number;
}

export default class SwaggerExtract extends Command {
  protected dirPath: string;
  protected language: string;
  private fileName: string;
  private extractedPaths: number;
  private extractedClasses: number;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { dirPath, language }: SwaggerExtractParams
  ) {
    const fileName = `nv-swagger-${v4()}.yml`;
    super({
      command: `nightvision swagger extract ${dirPath} --lang ${language} --no-upload --output ${fileName}`,
      webview: webview,
      requestId: requestId,
      cwd: dirPath,
      async: true
    });
    this.fileName = fileName;
    this.dirPath = dirPath;
    this.language = language;
    this.extractedPaths = 0;
    this.extractedClasses = 0;
  }

  async handleOutput(data: any) {
    const message = data.toString();

    if (!this.isLoggedIn(message)) {
      return;
    }

    if (/ERROR error/.test(message)) {
      this.webview.postMessage({
        command: SWAGGER_EXTRACT_ERROR,
        requestId: this.requestId,
        isFinal: true,
      });
    } else {
      this.parseResults(message);
    }
  }

  async handleClose(): Promise<void> {
    try {
      const filePath = `${this.dirPath}/${this.fileName}`;
      await fs.access(filePath);
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
    } catch (error) {
      this.webview.postMessage({
        command: SWAGGER_EXTRACT_ERROR,
        requestId: this.requestId,
        isFinal: true,
      });
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
