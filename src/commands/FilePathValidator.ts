import * as fs from 'fs';
import * as path from 'path';
import { makeFilePathAbsolute } from '@utils/filePathAbsolute';

export interface FilePathValidatorParams {
    filePath: string;
    mustBeDirectory: boolean;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export default class FilePathValidator {
    protected filePath: string;
    protected mustBeDirectory: boolean;

    constructor(
        { filePath, mustBeDirectory }: FilePathValidatorParams
    ) {
        this.filePath = filePath;
        this.mustBeDirectory = mustBeDirectory;
    }

    validate(): ValidationResult {
        this.filePath = makeFilePathAbsolute(this.filePath);

        if (!path.isAbsolute(this.filePath)) { // maybe not necessary this check, but just in case
            return { valid: false, error: 'Path must be absolute.' };
        }

        if (!fs.existsSync(this.filePath)) {
            return { valid: false, error: 'Path does not exist.' };
        }

        if (this.mustBeDirectory) {
            const stats = fs.lstatSync(this.filePath);
            if (!stats.isDirectory()) {
                return { valid: false, error: 'Path is not a directory.' };
            }
        }

        return { valid: true };
    }
}
