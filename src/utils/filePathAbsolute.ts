import * as vscode from 'vscode';
import * as path from 'path';

export const makeFilePathAbsolute = (filePath: string): string => {
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    
    // Resolve the path relative to the workspace root
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders && workspaceFolders.length > 0) {
        // Use the first workspace folder
        const workspaceRoot = workspaceFolders[0].uri.fsPath;
        filePath = path.join(workspaceRoot, filePath);
    } else {
        // If no workspace is open, resolve relative to the current working directory (unlikely to happen?)
        filePath = path.resolve(filePath);
    }
    

    return filePath;
}