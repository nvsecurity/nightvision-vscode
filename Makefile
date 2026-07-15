.PHONY: install build dev test clean

install:
	npm install

build:
	npm run package

# Build, start the watchers, and open an Extension Development Host.
# Blocks until the dev host window is closed, then tears down the watchers.
dev:
	npm run dev

test:
	npm test

clean:
	rimraf out dist .vscode-test *.vsix
