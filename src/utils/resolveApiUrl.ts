// Extension host only — do not import from webview code.
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEFAULT_API_URL = 'https://api.nightvision.net';

/**
 * Resolves the NightVision API URL using the same precedence as the CLI:
 * 1. NIGHTVISION_API_URL environment variable
 * 2. api-url from ~/.nightvision/nightvision.yml
 * 3. https://api.nightvision.net (default)
 *
 * The api-url from the config file includes /api/v1/ suffix which is stripped
 * to return the base URL.
 */
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.nightvision', 'nightvision.yml');

export function resolveApiUrl(configPath: string = DEFAULT_CONFIG_PATH): string {
    const envUrl = process.env.NIGHTVISION_API_URL;
    if (envUrl) {
        return stripApiSuffix(envUrl);
    }

    const configUrl = readConfigApiUrl(configPath);
    if (configUrl) {
        return stripApiSuffix(configUrl);
    }

    return DEFAULT_API_URL;
}

function readConfigApiUrl(configPath: string): string | undefined {
    try {
        const content = fs.readFileSync(configPath, 'utf8');
        const match = content.match(/^api-url:\s*(.+)$/m);
        return match?.[1]?.trim();
    } catch {
        return undefined;
    }
}

function stripApiSuffix(url: string): string {
    return url.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
}
