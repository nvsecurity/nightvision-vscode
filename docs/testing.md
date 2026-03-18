# Testing the NightVision VSCode Extension

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Visual Studio Code](https://code.visualstudio.com/)
- [NightVision CLI](https://docs.nightvision.net/docs/installing-the-cli) installed and on your PATH

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set a port for the webpack dev server (e.g. `PORT=8080`).

## Manual Testing

Manual testing runs the extension inside a VSCode Extension Development Host window.

### 1. Start the dev server

```bash
npm run watch
```

This starts two watchers in parallel:
- The extension code watcher (webpack)
- The webview dev server (webpack-dev-server on the port from `.env`)

Leave this running in the background.

### 2. Launch the Extension Development Host

In VSCode, with this project open:

1. Open the Run and Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select **"Run Extension"** from the dropdown
3. Press **F5**

A new VSCode window (the Extension Development Host) opens with your local extension loaded. Open the NightVision panel in the sidebar to interact with it.

### 3. Make changes

With `npm run watch` running, code changes to both the extension backend and the webview frontend are rebuilt automatically. To pick up changes:

- **Webview changes** (React components, pages, styles): Hot Module Replacement applies most changes automatically. If not, reload the Extension Development Host window (Cmd+Shift+P > "Developer: Reload Window").
- **Extension backend changes** (commands, extension.ts): Restart the debug session (Shift+Cmd+F5 or the restart button in the debug toolbar).

### 4. View logs

Logs from the extension backend (`console.log` in `extension.ts`, commands, etc.) appear in the **Debug Console** of the original VSCode window.

Logs from the webview (React app) appear in the Developer Tools console of the Extension Development Host window. Open it with **Help > Toggle Developer Tools** (Cmd+Option+I).

### 5. NightVision CLI login

The extension requires a valid NightVision CLI login. The extension reads the API URL from the same sources as the CLI, in this order:

1. `NIGHTVISION_API_URL` environment variable
2. `api-url` from `~/.nightvision/nightvision.yml` (written by `nightvision login`)
3. `https://api.nightvision.net` (default)

Just run `nightvision login` and the extension will automatically use the same environment:

```bash
# Production
nightvision login

# Staging
nightvision login --api-url https://api.test.nightvision.net/api/v1/
```

## Running the Test Suite

### From the command line

```bash
npm test
```

This runs the full pipeline:
1. **compile-tests** -- compiles TypeScript test files to `out/`
2. **package** -- builds the extension and webview with webpack
3. **lint** -- runs ESLint
4. **test** -- downloads a VSCode test instance (cached in `.vscode-test/`) and runs the Mocha test suite inside it

### From VSCode

1. Open the Run and Debug panel (Ctrl+Shift+D / Cmd+Shift+D)
2. Select **"Extension Tests"** from the dropdown
3. Press **F5**

Test results appear in the Debug Console.

### Writing tests

Test files live in `src/test/suite/` and must match the pattern `*.test.ts`. They use [Mocha](https://mochajs.org/) with the TDD interface (`suite`/`test`).

Example:

```typescript
import * as assert from 'assert';

suite('MyFeature', () => {
  test('should do something', () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

Path aliases (`@commands/*`, `@utils/*`, etc.) are available in tests -- they are resolved at runtime by `tsconfig-paths` in the test runner.

## Other Commands

| Command | Description |
|---|---|
| `npm run package` | Production build (extension + webview) |
| `npm run lint` | Run ESLint |
| `npm run compile-tests` | Compile test files only |
| `npm run watch-tests` | Watch and recompile test files |
| `npm run vsce:package` | Package as `.vsix` for distribution |
