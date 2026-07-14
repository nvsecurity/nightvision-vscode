---
name: release-process
description: Release and publish process for the NightVision VS Code plugin
---

# VS Code Plugin Release Process

## Overview

The release pipeline is: merge PR → release drafter updates draft → publish
GitHub Release → extension published to VS Code Marketplace → version
auto-bumped on main.

## Pre-release checklist

1. All tests pass: `make test`
2. Lint clean: `npm run lint`
3. Production package builds: `npx @vscode/vsce package`
4. Manual smoke test of the `.vsix`: `code --install-extension nightvision-<version>.vsix`
5. `CHANGELOG.md` updated with the upcoming version number
6. PR merged to `main`

## Automated workflows

### Release Drafter (`.github/workflows/release-drafter.yml`)

- Triggers on every push to `main`
- Automatically drafts/updates a GitHub Release with notes from merged PRs
- PR labels control categorization:
  - `feature`, `enhancement` → Features
  - `fix`, `bugfix`, `bug`, `quick-fix` → Bug Fixes
  - `chore`, `maintenance`, `cleanup` → Maintenance
  - `documentation`, `docs` → Documentation
- PR labels also control version resolution:
  - `major` → major bump
  - `minor` → minor bump
  - `patch` (or no label, default) → patch bump
- Config: `.github/release-drafter.yml`

### Publish (`.github/workflows/publish.yml`)

- Triggers when a GitHub Release is published, or via manual workflow dispatch
- Two jobs run sequentially:

**Job 1: publish**
- Runs `npm ci`, packages the `.vsix`, publishes to the VS Code Marketplace
- Uses `VSCODE_MARKETPLACE_TOKEN` secret from the `vscode-marketplace` environment

**Job 2: bump-version** (runs after publish succeeds)
- Checks out `main` with `GH_VSCODE_REPO_ACCESS_TOKEN`
- Runs `npm version patch` which updates `package.json`, creates a git tag,
  and commits with message `Chore(version): <version> [skip-ci]`
- Pushes the version bump commit and tag to `main`
- The `[skip-ci]` suffix prevents the version bump from re-triggering CI

### Bump Version (`.github/workflows/bump-version.yml`)

- Manual workflow dispatch only
- Bumps patch version on `main` without publishing
- Use when you need to bump the version without releasing

## Secrets required

| Secret | Environment | Purpose |
|--------|-------------|---------|
| `VSCODE_MARKETPLACE_TOKEN` | `vscode-marketplace` | Publishing to VS Code Marketplace |
| `GH_VSCODE_REPO_ACCESS_TOKEN` | `vscode-marketplace` | Pushing version bump commits to `main` |
| `GITHUB_TOKEN` | (automatic) | Release drafter |

## Package contents

The `.vsix` package is controlled by `.vscodeignore`. Only these files ship:

- `dist/extension.js` — webpack-bundled extension host code
- `dist/webview.js` — webpack-bundled React webview
- `docs/icon.png` — extension icon
- `media/nightvision.svg` — sidebar icon
- `README.md`, `LICENSE`, `CHANGELOG.md`, `package.json`

Everything else (source, tests, config, build tools, docs/testing.md) is excluded.

## Manual release steps

1. Go to the GitHub repository's Releases page
2. Find the draft release created by Release Drafter
3. Review and edit the release notes if needed
4. Set the tag (release drafter suggests one based on PR labels)
5. Click "Publish release"
6. The publish workflow runs automatically
7. Verify the extension appears on the
   [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)

## Local package testing

Build and install locally before releasing:

```bash
npx @vscode/vsce package
code --install-extension nightvision-<version>.vsix
```

Uninstall after testing:

```bash
code --uninstall-extension nvsecurity.nightvision
```

## Publishing (manual fallback)

If the workflow fails or you need to publish locally:

```bash
npm ci
npx @vscode/vsce package
npx @vscode/vsce publish -p <VSCODE_MARKETPLACE_TOKEN>
```

The token is a Personal Access Token from Azure DevOps with
Marketplace > Manage scope. No signing is required — Microsoft handles
that on the Marketplace side.

## Marketplace details

- **Extension ID:** `nvsecurity.nightvision`
- **URL:** https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision
- **Publisher:** nvsecurity
- **Vendor:** NightVision (support@nightviz.ai)

## Version numbering

- Current version is in `package.json` `version` field
- The publish workflow auto-bumps patch after each release
- Use PR labels (`major`, `minor`) to control the release drafter's
  suggested version for non-patch releases
- `CHANGELOG.md` should use the next version number (check `package.json`)

## Troubleshooting

- **Publish fails with auth error**: Check that `VSCODE_MARKETPLACE_TOKEN`
  is valid and not expired. Generate a new one from the
  [Azure DevOps PAT page](https://dev.azure.com/) with Marketplace > Manage scope.
- **Version bump fails**: Check that `GH_VSCODE_REPO_ACCESS_TOKEN` has push
  access to `main`. Branch protection rules may block the push.
- **Release drafter not updating**: Ensure PRs are merged (not squash-merged
  via the merge button without the drafter running). Check that the drafter
  action has `GITHUB_TOKEN` permissions.
- **`.vsix` too large**: Check `.vscodeignore` for missing exclusions. Run
  `npx @vscode/vsce ls --tree` to inspect package contents.

## Relationship to IntelliJ plugin

The IntelliJ plugin (`nvsecurity/nightvision-intellij`) has an analogous
publish workflow triggered by GitHub Release. Key differences:

- IntelliJ requires plugin signing (self-signed cert); VS Code does not
- IntelliJ version bumps are manual; VS Code auto-bumps after publish
- IntelliJ uses `build.gradle.kts` for version; VS Code uses `package.json`
- IntelliJ has change-notes in `plugin.xml`; VS Code uses `CHANGELOG.md`
