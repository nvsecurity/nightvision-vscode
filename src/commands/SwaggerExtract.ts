import * as vscode from 'vscode';
import Command from '@commands/Command';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import { SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR, SWAGGER_EXTRACT_NO_PATHS_FOUND } from './CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';
import * as path from 'path';
import { makeFilePathAbsolute } from '@utils/filePathAbsolute';

export interface SwaggerExtractParams {
  dirPath: string;
  language: string;
  verbose: boolean;
  fileFormat: string;
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
    { dirPath, language, verbose, fileFormat }: SwaggerExtractParams
  ) {
    dirPath = makeFilePathAbsolute(dirPath);

    var fileFormatCmd = '';
    var verboseCmd = '';
    if (verbose) {
      verboseCmd = ' --verbose';
    }
    var extension = 'yml';
    if (fileFormat) {
      if (fileFormat === 'json') {
        extension = 'json';
      }
      fileFormatCmd = ` --file-format ${fileFormat}`;
    }
    const fileName = `nv-swagger-${v4()}.${extension}`;
    const cmd = `${NIGHTVISION} swagger extract ${dirPath} --lang ${language} --no-upload --output ${fileName}${fileFormatCmd}${verboseCmd}`;
    super({
      command: cmd,
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

    if (/0 paths discovered/.test(message)) {
      this.webview.postMessage({
        command: SWAGGER_EXTRACT_NO_PATHS_FOUND,
        requestId: this.requestId,
        isFinal: true,
      });
    }
    else if (/ERROR error/.test(message)) {
      this.webview.postMessage({
        command: SWAGGER_EXTRACT_ERROR,
        requestId: this.requestId,
        isFinal: true,
      });
    } else {
      this.parseResults(message);
    }
  }

  handleError(err: NodeJS.ErrnoException) {
    // Let's do nothing here
    // the parent class will always emit CLI_MISSING for ENOENT errors
    // and we don't want that here, as we can face missing files
    // and we are handling them already, so we don't want any collateral weird effects, leave this empty.
  }

  async handleClose(): Promise<void> {
    try {
      let filePath = path.join(this.dirPath, this.fileName);

      filePath = makeFilePathAbsolute(filePath);

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
