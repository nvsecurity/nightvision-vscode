import * as vscode from 'vscode';

export interface OpenFileDialogParams {
  canSelectFiles?: boolean;
  canSelectFolders?: boolean;
  canSelectMany?: boolean;
  openLabel?: string;
}

export const openFileDialog = async ({
  canSelectFiles,
  canSelectFolders,
  canSelectMany,
  openLabel,
}: OpenFileDialogParams): Promise<string[]> => {
  let selectedPaths: string[] = [];
  const uri = await vscode.window.showOpenDialog({
    canSelectMany: canSelectMany,
    openLabel: openLabel,
    canSelectFiles: canSelectFiles,
    canSelectFolders: canSelectFolders,
  });

  if (uri && uri.length > 0) {
    selectedPaths = uri.map(u => vscode.workspace.asRelativePath(u));
  }

  return selectedPaths;
};