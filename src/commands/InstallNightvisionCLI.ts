import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as https from 'https';
import * as tar from 'tar';
import * as child_process from 'child_process';

const OK_RELOAD_WINDOW = 'Ok (reload window)';

const getErrorMessage = (err: any) => {
    let message = 'Unknown Error';
    if (err instanceof Error) {
        message = err.message;
    } else if (typeof err === "string") {
        message = err;
    }
    return message;
};

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
};

const getDestinationDirForPlatform = (platform: string): string => {
    let destinationDir: string;
    if (platform === 'win32') {
        destinationDir = path.join(os.homedir(), 'AppData', 'Local', 'NightVision', 'bin');
    } else {
        destinationDir = path.join(os.homedir(), '.local', 'nightvision', 'bin');
    }
    return destinationDir;
};

export const putCLIToVSCodePath = () => {
    const platform = os.platform();
    const destinationDir = getDestinationDirForPlatform(platform);
    if (fs.existsSync(destinationDir)) {
        if (process.env.PATH && process.env.PATH.includes(destinationDir)) {
            return;
        }
        process.env.PATH = `${destinationDir}${path.delimiter}${process.env.PATH}`;
    }
};

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


        const pathIncludesDestinationDir = havePathAlreadySet(platform, destinationDir);
        if (!pathIncludesDestinationDir) {
            await addToPath(platform);
        }
        putCLIToVSCodePath();
        return true;
    } catch (err) {
        const message = getErrorMessage(err);
        console.error(`Installation error: ${message}`);
        vscode.window.showErrorMessage(`Failed to install NightVision CLI. Error: ${message}`);
    }
    return false;
};

const havePathAlreadySet = (platform: string, destinationDir: string): boolean => {
    switch (platform) {
        case 'win32':
            return havePathAlreadySetWindows(destinationDir);
        default:
            return havePathAlreadySetUnix(destinationDir);
    }
};

const havePathAlreadySetUnix = (destinationDir: string): boolean => {
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

    if (fs.existsSync(rcFile)) {
        const fileContent = fs.readFileSync(rcFile, 'utf8');
        return fileContent.includes(destinationDir);
    }

    return false;
};

const havePathAlreadySetWindows = (destinationDir: string): boolean => {
    const currentUserPath = process.env['PATH'] || '';
    return currentUserPath.includes(destinationDir);
};

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
};

const addToPath = async (platform: string) => {
    const destinationDir = getDestinationDirForPlatform(os.platform());

    if (platform === 'win32') {
        await vscode.window.showInformationMessage(
            `The NightVision CLI has been installed. Please manually add it to your PATH: ${destinationDir}`,
            'Ok'
        );
        return; // For Windows, let's not automatically set
    }

    const addToPathResponse = await vscode.window.showInformationMessage(
        `The NightVision CLI has been installed. Would you like to automatically add it to your PATH? ('${destinationDir}')`,
        'Yes',
        'No'
    );

    if (addToPathResponse === 'Yes') {
        await addToUserPathUnix(destinationDir);
    }
};

const reloadWindow = (option: string | undefined) => {
    if (option === OK_RELOAD_WINDOW) {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
};

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

        const exportLine = `\n# Added by NightVision\nexport PATH="$PATH${path.delimiter}${directory}"\n`;

        if (fs.existsSync(rcFile)) {
            const fileContent = await fs.promises.readFile(rcFile, 'utf8');
            if (!fileContent.includes(directory)) {
                await fs.promises.appendFile(rcFile, exportLine);
                const response = await vscode.window.showInformationMessage(
                    `Added NightVision CLI to PATH in ${rcFile}. You may need to reopen the terminal windows for changes to take effect.`,
                    OK_RELOAD_WINDOW
                );
                reloadWindow(response);
            }
        } else {
            await fs.promises.writeFile(rcFile, exportLine);
            const response = await vscode.window.showInformationMessage(
                `Created ${rcFile} and added NightVision CLI to PATH. You may need to reopen the terminal windows for changes to take effect.`,
                OK_RELOAD_WINDOW
            );
            reloadWindow(response);
        }
    } catch (err) {
        console.error('Failed to update PATH:', err);
        vscode.window.showErrorMessage('Failed to add NightVision CLI to PATH.');
    }
};

// Deprecated: setx truncates PATH to 1024 chars. Let's disable it for now.
const addToUserPathWindows = async (directory: string) => {
    try {
        const currentUserPath = process.env['PATH'] || '';
        if (currentUserPath) {
            // Using 'setx' to update the user environment variable
            child_process.execSync(`setx PATH "${currentUserPath}${path.delimiter}${directory}"`);
            const response = await vscode.window.showInformationMessage(
                'Added NightVision CLI to PATH. You may need to reopen the terminal windows for changes to take effect.',
                OK_RELOAD_WINDOW
            );
            reloadWindow(response);
        }
    } catch (err) {
        console.error('Failed to update PATH:', err);
        vscode.window.showErrorMessage('Failed to add NightVision CLI to PATH.');
    }
};