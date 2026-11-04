// Shared by the extension host and the webview, so this module must stay free
// of Node and VS Code imports.

// NV-6111: the app moved to nightviz.ai. nightvision.net keeps serving, so a
// URL configured with it still works; this is only the default.
export const DEFAULT_API_URL = 'https://api.nightviz.ai';
