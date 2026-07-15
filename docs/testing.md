# Testing the NightVision VSCode Extension

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [Visual Studio Code](https://code.visualstudio.com/)
- [NightVision CLI](https://docs.nightviz.ai/welcome/tutorials-and-guides/installing-the-cli/) installed and on your PATH

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` and set a port for the webpack dev server (e.g. `PORT=8080`).

## Manual Testing

Manual testing runs the extension inside a VSCode Extension Development Host window.

The quickest path is a single command:

```bash
make dev
```

It starts the watchers, waits until both bundles are servable, and opens the
Extension Development Host. Closing that window tears the watchers down. Note
this launches without a debugger attached; to pick up extension backend
changes in this mode, reload the dev host window (Cmd+R) instead of
restarting a debug session.

To run the same thing manually, or with the debugger attached:

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

## Testing the Production Package

The dev server and Extension Development Host use a different code path than the
published extension. To verify the extension works as it would for end users,
build and install the `.vsix` locally:

```bash
npx @vscode/vsce package
code --install-extension nightvision-<version>.vsix
```

Then reload VSCode and test the extension from the sidebar. The version number in
the filename should match `version` in `package.json`.

To uninstall afterwards:

1. Open the Extensions panel (Cmd+Shift+X)
2. Find NightVision, click the gear icon, and select **Uninstall**

This is worth doing before any release, especially after changes to webpack
config, `.vscodeignore`, the webview HTML in `extension.ts`, or the API URL
resolution logic.

## Other Commands

| Command | Description |
|---|---|
| `make install` | Install npm dependencies |
| `make dev` | Start watchers and open an Extension Development Host |
| `make build` | Production build (extension + webview) |
| `make test` | Full pipeline: compile, build, lint, and test |
| `make clean` | Remove `out/`, `dist/`, `.vscode-test/`, and `*.vsix` |
| `npm run lint` | Run ESLint only |
| `npm run compile-tests` | Compile test files only |
| `npm run watch-tests` | Watch and recompile test files |
