import * as vscode from 'vscode';
import Command, { Flag } from '@commands/Command';
import fs from 'fs/promises';
import { v4 } from 'uuid';
import { EXECUTION_LOGS, SWAGGER_EXTRACT, SWAGGER_EXTRACT_ERROR, SWAGGER_EXTRACT_NO_PATHS_FOUND } from './CommandConstants';
import { NIGHTVISION } from '@constants/GlobalConstants';
import * as path from 'path';
import { makeFilePathAbsolute } from '@utils/filePathAbsolute';
import { storeSpecContent } from '@utils/specContentProvider';

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

export interface SwaggerExtractExecutionLogs {
  message: string;
}

export default class SwaggerExtract extends Command {
  protected dirPath: string;
  protected language: string;
  private fileName: string;
  private extractedPaths: number;
  private extractedClasses: number;
  private fileFormat: string;
  private displayName!: string;

  constructor(
    webview: vscode.Webview,
    requestId: string,
    { dirPath, language, verbose, fileFormat }: SwaggerExtractParams
  ) {
    dirPath = makeFilePathAbsolute(dirPath);

    // CLI generates .yml files, but VSCode's language ID for YAML is 'yaml'
    var extension = 'yml';
    if (fileFormat === 'json') {
      extension = 'json';
    }
    const fileName = `nv-swagger-${v4()}.${extension}`;

    const flags: Flag[] = [
      { flag: dirPath },
      { flag: '--no-upload' },
      { flag: '--output', value: fileName },
    ];
    if (language && language !== 'all') {
      flags.push({ flag: '--lang', value: language });
    }
    if (fileFormat) {
      flags.push({ flag: '--file-format', value: fileFormat });
    }
    if (verbose) {
      flags.push({ flag: '--verbose' });
    }

    super({
      command: `${NIGHTVISION} swagger extract`,
      webview: webview,
      requestId: requestId,
      flags: flags,
      cwd: dirPath,
      async: true
    });
    this.fileName = fileName;
    this.dirPath = dirPath;
    this.language = language;
    this.extractedPaths = 0;
    this.extractedClasses = 0;
    this.fileFormat = extension === 'json' ? 'json' : 'yaml';
    const dirName = path.basename(dirPath) || 'project';
    this.displayName = `${dirName}-openapi.${extension}`;
  }

  async handleOutput(data: any) {
    const message = data.toString();

    this.webview.postMessage({
      command: EXECUTION_LOGS,
      requestId: this.requestId,
      payload: {
        message: message,
      } as SwaggerExtractExecutionLogs,
      isFinal: false,
    });

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
    const filePath = makeFilePathAbsolute(path.join(this.dirPath, this.fileName));
    try {
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
    } finally {
      // The CLI writes this file into the user's project directory, so it
      // must not survive the request on any path. Command invokes
      // handleClose without awaiting it, so cleanup must never throw.
      await fs.rm(filePath, { force: true }).catch(() => {});
    }
  }

  private async processFile(filePath: string) {
    const data = await fs.readFile(filePath, 'utf8');

    const uri = storeSpecContent(this.displayName, data);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(document, this.fileFormat);
    await vscode.window.showTextDocument(document, { preview: false });
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
