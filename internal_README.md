## Contributing

### Prerequisites

- [NightVision CLI](https://docs.nightviz.ai/welcome/tutorials-and-guides/installing-the-cli/)
- Visual Studio Code (VSCode) version 1.75.0 or greater
- [Node.js](https://nodejs.org)

### Installation

1. Clone the repo

```sh
git clone https://github.com/nvsecurity/nightvision-vscode.git
```

2. Change directory

```sh
cd nightvision-vscode
```

3. Install NPM packages

```sh
npm install
```

4. Make a copy of `.env.example` and name it `.env`

5. Edit `.env` and choose a port

```env
PORT=8080
```

### Running the extension

The one-command way:

```sh
make dev
```

This starts the watchers, waits for the bundles to be ready, and opens an
Extension Development Host window. Closing that window shuts the watchers
down again.

Alternatively, to run with the debugger attached:

1. Start the server

```sh
npm run watch
```

2. Open the repo in VSCode

3. Run and Debug (Press `F5`) to open a new window with the extension loaded

## Disclaimer

To use this plugin, you will need a NightVision account. The plugin uses NightVision's API and command line to scan the code, scan the running application, and enrich the results provided into the IDE.
