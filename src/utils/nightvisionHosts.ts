// Shared by the extension host and the webview, so this module must stay free
// of Node and VS Code imports.

// NV-6111: the app moved to nightviz.ai. nightvision.net keeps serving, so a
// URL configured with it still works; these are only the defaults.
export const DEFAULT_API_URL = 'https://api.nightviz.ai';
export const DEFAULT_APP_URL = 'https://app.nightviz.ai';

const NIGHTVISION_DOMAINS = ['nightviz.ai', 'nightvision.net'];

/**
 * Returns the web app URL that belongs to an API URL, so links open in the
 * same environment and on the same domain as the API the extension calls:
 *
 * - api.<domain>       -> app.<domain>
 * - api.<env>.<domain> -> <env>.<domain>
 *
 * Any other host falls back to the production app on nightviz.ai.
 */
export function appUrlForApi(apiUrl: string): string {
  let host: string;
  try {
    host = new URL(apiUrl).hostname.toLowerCase();
  } catch {
    return DEFAULT_APP_URL;
  }

  for (const domain of NIGHTVISION_DOMAINS) {
    if (host === `api.${domain}`) {
      return `https://app.${domain}`;
    }
    const env = host.match(/^api\.([a-z0-9-]+)\./)?.[1];
    if (env && host === `api.${env}.${domain}`) {
      return `https://${env}.${domain}`;
    }
  }

  return DEFAULT_APP_URL;
}
