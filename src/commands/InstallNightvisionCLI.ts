import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as https from 'https';
import * as tar from 'tar';
import * as child_process from 'child_process';

const getErrorMessage = (err: any) => {
    let message = 'Unknown Error';
    if (err instanceof Error) {
        message = err.message;
    } else if (typeof err === "string") {
        message = err;
    }
    return message;
}

const getCLIDownloadUrl = (platform: string, arch: string): string | undefined => {
    let downloadUrl: string | undefined;
    if (platform === 'win32') {
        if (arch === 'x64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_windows_amd64.tar.gz';
        } else if (arch === 'arm64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_windows_arm64.tar.gz';
        }
    } else if (platform === 'darwin') {
        if (arch === 'x64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_darwin_amd64.tar.gz';
        } else if (arch === 'arm64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_darwin_arm64.tar.gz';
        }
    } else if (platform === 'linux') {
        if (arch === 'x64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_linux_amd64.tar.gz';
        } else if (arch === 'arm64') {
            downloadUrl = 'https://downloads.nightvision.net/binaries/latest/nightvision_latest_linux_arm64.tar.gz';
        }
    }
    return downloadUrl;
}

const getDestinationDirForPlatform = (platform: string): string => {
    let destinationDir: string;
    if (platform === 'win32') {
        destinationDir = path.join(os.homedir(), 'AppData', 'Local', 'Nightvision', 'bin');
    } else {
        destinationDir = path.join(os.homedir(), '.local', 'nightvision', 'bin');
    }
    return destinationDir;
}

export const putCLIToVSCodePath = () => {
    const destinationDir = getDestinationDirForPlatform(os.platform());
    if (process.env.PATH && process.env.PATH.includes(destinationDir)) {
        return;
    }
    process.env.PATH = `${process.env.PATH}${path.delimiter}${destinationDir}`;
}

export const installNightvisionCLI = async (): Promise<boolean> => {
    const platform = os.platform();
    const arch = os.arch();

    const destinationDir = getDestinationDirForPlatform(platform);
    let cliExecutable: string;

    // Set the installation directory within the user's home directory
    if (platform === 'win32') {
        cliExecutable = path.join(destinationDir, 'nightvision.exe');
    } else {
        cliExecutable = path.join(destinationDir, 'nightvision');
    }

    if (fs.existsSync(cliExecutable)) {
        // await addToPath(`Nightvision CLI is already installed, but not added to PATH.`, destinationDir, platform);
        putCLIToVSCodePath();
        return true;
    }

    const downloadUrl = getCLIDownloadUrl(platform, arch);

    if (!downloadUrl) {
        vscode.window.showErrorMessage(`Unsupported platform or architecture. Platform: ${platform}; Architecture: ${arch}`);
        return false;
    }

    try {
        await fs.promises.mkdir(destinationDir, { recursive: true });

        const tempTarballPath = path.join(os.tmpdir(), `nightvision_${Date.now()}.tar.gz`);

        await downloadFile(downloadUrl, tempTarballPath);

        await tar.x({
            file: tempTarballPath,
            cwd: destinationDir,
        });

        await fs.promises.unlink(tempTarballPath); // Deleting the temporary tarball

        if (platform !== 'win32') {
            // Making the CLI executable (necessary on macOS/Linux)
            await fs.promises.chmod(cliExecutable, 0o755);
        }

        // await addToPath(`Nightvision CLI installed successfully.`, destinationDir, platform);
        putCLIToVSCodePath();
        return true;
    } catch (err) {
        const message = getErrorMessage(err);
        console.error(`Installation error: ${message}`);
        vscode.window.showErrorMessage(`Failed to install Nightvision CLI. Error: ${message}`);
    }
    return false;
}

const downloadFile = (url: string, dest: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
        });

        file.on('finish', () => {
            file.close(() => resolve());
        });

        file.on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// TODO: Use this somewhere as it can be useful
const addToPath = async (messagePrefix: string, destinationDir: string, platform: string) => {
    // Here we ask the user if they want to add the CLI to their PATH, so they can run it from the terminal anytime
    const addToPath = await vscode.window.showInformationMessage(
        `${messagePrefix} Would you like to automatically add nightvision CLI to your PATH? ('${destinationDir}')`,
        'Yes',
        'No'
    );

    if (addToPath === 'Yes') {
        if (platform === 'win32') {
            addToUserPathWindows(destinationDir);
        } else {
            await addToUserPathUnix(destinationDir);
        }
    }
}

const addToUserPathUnix = async (directory: string) => {
    try {
        const homeDir = os.homedir();
        const shell = process.env['SHELL'] || '';
        let rcFile = '';

        if (shell.includes('bash')) {
            rcFile = path.join(homeDir, '.bashrc');
        } else if (shell.includes('zsh')) {
            rcFile = path.join(homeDir, '.zshrc');
        } else {
            rcFile = path.join(homeDir, '.profile');
        }

        const exportLine = `\n# Added by Nightvision\nexport PATH="$PATH${path.delimiter}${directory}"\n`;

        if (fs.existsSync(rcFile)) {
            const fileContent = await fs.promises.readFile(rcFile, 'utf8');
            if (!fileContent.includes(directory)) {
                await fs.promises.appendFile(rcFile, exportLine);
                vscode.window.showInformationMessage(
                    `Added Nightvision CLI to PATH in ${rcFile}. You may need to reopen all VSCode windows for changes to take effect.`
                );
            }
        } else {
            await fs.promises.writeFile(rcFile, exportLine);
            vscode.window.showInformationMessage(
                `Created ${rcFile} and added Nightvision CLI to PATH. You may need to reopen all VSCode windows for changes to take effect.`
            );
        }
    } catch (err) {
        console.error('Failed to update PATH:', err);
        vscode.window.showErrorMessage('Failed to add Nightvision CLI to PATH.');
    }
};

const addToUserPathWindows = (directory: string) => {
    try {
        const currentUserPath = process.env['PATH'] || '';
        if (!currentUserPath.includes(directory)) {
            // Using 'setx' to update the user environment variable
            child_process.execSync(`setx PATH "${currentUserPath}${path.delimiter}${directory}"`);
            vscode.window.showInformationMessage(
                'Added Nightvision CLI to PATH. You may need to reopen all VSCode windows for changes to take effect.'
            );
        }
    } catch (err) {
        console.error('Failed to update PATH:', err);
        vscode.window.showErrorMessage('Failed to add Nightvision CLI to PATH.');
    }
};