# Changelog

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
