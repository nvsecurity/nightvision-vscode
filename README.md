# NightVision Visual Studio Code Extension

[![VSCode Extension](https://img.shields.io/badge/VSCode_Extension-Install-blue)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)

[![Installs-count](https://vsmarketplacebadges.dev/installs-short/nvsecurity.nightvision.png)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)

A VSCode extension for the NightVision CLI.

## Getting Started

### Install

Open the NightVision Extension for Visual Studio Code in the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision).

### Dependencies

- [NightVision CLI](https://docs.nightvision.net/docs/installing-the-cli)

### Usage

For this example, we'll be using the `HTML5 Vulnweb` website from the [public vulnerable websites](https://docs.nightvision.net/docs/public-vulnerable-websites).

#### Projects

Create a new project called `HTML5-Vulnweb`.

![project.gif](https://raw.githubusercontent.com/spatiag/nv-images/main/project.gif)

#### Targets

Create a new target called `HTML5-Vulnweb-Target` and set the URL to `http://testhtml5.vulnweb.com`.

![target.gif](https://raw.githubusercontent.com/spatiag/nv-images/main/target.gif)

#### Authentications

Create a new Playwright authentication named `HTML5-Vulnweb-Auth` and set the URL to `http://testhtml5.vulnweb.com`. This will open a Chrome window at the specified URL. Log in using the username `admin` and password `admin`. This authentication enables comprehensive testing of the website, revealing issues behind login screens and other authentication barriers.

![authentication.gif](https://raw.githubusercontent.com/spatiag/nv-images/main/authentication.gif)

#### Scans

Initiate a new scan using the target and authentication we just set up. NightVision will begin analyzing the website for any vulnerabilities.

![scan.gif](https://raw.githubusercontent.com/spatiag/nv-images/main/scan.gif)

You can monitor the scan in progress or review it after completion to see the vulnerabilities the program has identified on the website.

![scan2.gif](https://raw.githubusercontent.com/spatiag/nv-images/main/scan2.gif)

## Contributing

### Prerequisites

- [NightVision CLI](https://docs.nightvision.net/docs/installing-the-cli)
- Visual Studio Code (VSCode) version 1.75.0 or greater

### Installation

1. Clone the repo

```sh
git clone https://github.com/nvsecurity/vscode-extension.git
```

2. Change directory

```sh
cd nightvision
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

1. Start the server

```sh
npm run watch
```

2. Open the repo in VSCode

3. Run and Debug (Press `F5`) to open a new window with the extension loaded

## Disclaimer

To use this plugin, you will need a NightVision account. The plugin uses NightVision's API and command line to scan the code, scan the running application, and enrich the results provided into the IDE.
