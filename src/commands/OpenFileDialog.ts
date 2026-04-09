import * as vscode from 'vscode';
import { makeFilePathAbsolute } from '@utils/filePathAbsolute';

export interface OpenFileDialogParams {
  canSelectFiles?: boolean;
  canSelectFolders?: boolean;
  canSelectMany?: boolean;
  openLabel?: string;
  defaultPath?: string;
}

export const openFileDialog = async ({
  canSelectFiles,
  canSelectFolders,
  canSelectMany,
  openLabel,
  defaultPath,
}: OpenFileDialogParams): Promise<string[]> => {
  let selectedPaths: string[] = [];
  const uri = await vscode.window.showOpenDialog({
    canSelectMany: canSelectMany,
    openLabel: openLabel,
    canSelectFiles: canSelectFiles,
    canSelectFolders: canSelectFolders,
    defaultUri: defaultPath ? vscode.Uri.file(makeFilePathAbsolute(defaultPath)) : undefined,
  });

  if (uri && uri.length > 0) {
    selectedPaths = uri.map(u => vscode.workspace.asRelativePath(u));
  }

  return selectedPaths;
};