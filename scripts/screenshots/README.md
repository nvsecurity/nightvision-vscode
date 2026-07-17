# Marketplace screenshot harness

These Playwright scripts drive the real extension inside `code serve-web`
and capture the retina (2x) screenshots referenced by README.md. The
canonical copies live in this repo at `docs/images/`, hotlinked by the
README via `raw.githubusercontent.com/.../HEAD/docs/images/<name>.png`
(the repo must remain public for those URLs to serve). They are excluded
from the vsix via .vscodeignore.

Re-run this harness after UI changes and review the output. Keep
filenames stable: published extension READMEs hotlink these URLs, so
refresh images in place and never rename or delete one that a shipped
README still references.

## Shot inventory

All shots use Default Dark Modern and a ~500 CSS px sidebar (1000 px
output), trimmed to content height; modal shots trim to the modal card.
Exception: `api_discovery_example.png` captures activity bar + sidebar +
editor at a 1200 px viewport.

- `capture.js`: page shots: overview (submenu expanded), projects,
  project details, targets, target details, authentications, auth
  details, scans (narrow and wide), scan config, scan details
- `modals.js`: create-project/target/authentication modals, fields
  filled, never submitted
- `discovery.js`: runs a real Java extraction and captures the
  sidebar + generated spec in the editor
- `probe.js`: minimal click-through sanity check for debugging

## Prerequisites

1. `nightvision` CLI on PATH, logged in as the demo account `nv-demo`
   (nv-demo@nightvision.net). The account's fixtures (project `nv-demo`,
   target `javaspringvulny`, one Playwright authentication, at least two
   completed scans) are what the data pages display. A second target,
   `public-firing-range` (Web type), is selected by no script but keeps
   the targets list populated and shows the Web/API type contrast in
   `target_1.png`.
2. `code serve-web` running on 127.0.0.1:8000 with the NightVision
   extension installed in it from the Marketplace. The connection token
   is read from `~/.vscode/cli/serve-web-token` automatically.
3. `playwright-core` resolvable from the repo root
   (`npm install --no-save playwright-core`) and a Chrome for Testing
   binary passed via `CHROMIUM_PATH` (e.g. from
   `~/Library/Caches/ms-playwright`).
4. For `discovery.js` only: a clone of
   https://github.com/vulnerable-apps/javaspringvulny at
   `/tmp/javaspringvulny` (the path is visible in the screenshot, so
   keep it neutral).

## Running

```sh
export CHROMIUM_PATH="$HOME/Library/Caches/ms-playwright/chromium-<rev>/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
export OUT_DIR=docs/images
node scripts/screenshots/capture.js
node scripts/screenshots/modals.js
node scripts/screenshots/discovery.js
```

## Notes

- Fresh browser profiles follow the OS color scheme; the scripts force
  Dark Modern via Cmd+K Cmd+T and verify the `.vs-dark` workbench class.
- Hover tooltips are suppressed with injected CSS because the automation
  mouse legitimately hovers elements; a no-mouse capture has none. The
  sash drag that widens the sidebar likewise leaves a hover highlight on
  the sash, so scripts park the mouse away from the clip before shooting.
- Driving the webview requires Playwright frame locators
  (`iframe.webview.ready`, then `#active-frame`); browser-extension
  automation cannot navigate the webview's react-router links.
- Not covered by automation: the Playwright-recording steps of the
  authentication flow (external browser plus Inspector windows) and an
  in-progress scan; capture those manually if ever needed again.
