.PHONY: install build test clean

install:
	npm install

build:
	npm run package

test:
	npm test

clean:
	rimraf out dist .vscode-test *.vsix
