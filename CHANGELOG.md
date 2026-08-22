# Changelog

## [1.0.8]

### Fixed
- A CLI newer than the version the extension requires is no longer reported as outdated: the comparison stops at the first segment that settles it, and a pre-release suffix such as `0.15.3-beta` reads as `0.15.3`

### Changed
- `uuid`, `webpack-dev-server` and `react-router` upgraded to close their remaining advisories; the repository now reports no npm advisories at any severity
- GitHub Actions moved off the deprecated Node 20 runtime

## [1.0.7]

### Fixed
- A scan that fails to start reports the CLI's own reason, instead of leaving "Starting scan, please wait..." on screen and reporting nothing
- A CLI that hangs before starting a scan is given a bounded period to report one, so the panel no longer waits indefinitely
- Switching project on the scan page no longer keeps the authentication chosen for the previous project, which left the panel showing no credential while the scan still sent one and was rejected
- A target whose name contains a space is passed to the CLI as one argument, instead of being split so that the wrong target was looked up
- The install and update prompts spell NightVision correctly
- The scan status line no longer renders at the smaller, de-emphasised size used for muted labels

### Changed
- The minimum CLI version is 0.15.0, the oldest observed to complete a scan of a target that is not reachable from the internet
- The CLI update prompt names the binary the extension resolved, since the extension's own copy takes precedence on `PATH`
- Non-breaking dependency security updates, and test coverage for Windows CLI paths and scan deadlines

## [1.0.6]

### Added
- Screenshot harness under `scripts/screenshots/` that drives the extension in `code serve-web` to regenerate the README captures

### Changed
- README documents web application scanning, the Spec URL / Spec File target options, the Cookie and Header authentication types, and the current API Discovery flow
- README screenshots retaken against the current UI in dark theme and hosted in this repository instead of a third-party repo

## [1.0.5]

### Added
- Project label on the scans project filter
- Spec URL label on the OpenAPI spec input in the create and update target forms
- `make dev` target: start the watchers and open an Extension Development Host in one command

### Changed
- Clearer visual hierarchy in the sidebar: inputs and selects have themed borders, section titles are bold, and field labels, column headers, and date separators are muted
- Scan details show target, project, and authentication as plain text instead of disabled dropdowns, so values are readable and copyable
- Support contact email is now support@nightviz.ai
- Marketing and documentation links updated for the migration to nightviz.ai

### Fixed
- API Discovery no longer leaves a stray temp file in the scanned project when reading the extraction output fails

## [1.0.4]

### Added
- 20-second timeout on startup CLI commands with a clear error UI and Retry button
- Aggregate all startup failures together instead of showing only the first
- Surface unhandled spawn errors with the failing command name

### Fixed
- API Discovery folder picker now opens at the current path instead of the OS home directory
- `CliVersion` regex no longer matches IP addresses as version numbers (e.g., `127.0.0.1` was being parsed as `127.0.0`)

## [1.0.3]

### Added
- PHP and Go language support for API Discovery
- "All languages" option that runs extraction without specifying a language
- Pre-fill API Discovery path with the current workspace folder
- Meaningful tab names for generated OpenAPI specs
- Resolve API URL from CLI config, matching the CLI's configured environment
- Test suite with 19 tests and CI integration

### Fixed
- Login detection no longer depends on specific CLI output text
- Extension no longer crashes when no project is selected
- CLI commands no longer break on directory paths with spaces
- NV logo renders cleanly at all sizes
- All npm audit vulnerabilities resolved
