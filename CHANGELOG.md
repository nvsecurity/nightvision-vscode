# Changelog

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
