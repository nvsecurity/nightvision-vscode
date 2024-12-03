# NightVision Visual Studio Code Extension

<div style="text-align:center">
    <img style="width: 150px;" src="docs/nvlogo.png" />
</div>

Leverage [NightVision](https://www.nightvision.net/) to document APIs, run [DAST](https://www.nightvision.net/blog/the-essential-role-of-dynamic-application-security-testing-dast-in-complementing-static-application-security-testing-sast) scans, and uncover vulnerabilities in both known and unknown endpoints!

[![VSCode Extension](https://img.shields.io/badge/VSCode_Extension-Install-blue)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)
[![Installs-count](https://vsmarketplacebadges.dev/installs-short/nvsecurity.nightvision.png)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)

## Getting Started

In order to use this extension you must have a **NightVision account**. Additionally, it will be required to install the NightVision CLI, that can be done either through this extension or [manually](https://docs.nightvision.net/docs/installing-the-cli). It is available for all platforms: Windows, Linux and MacOS.

### Main page

If you have installed the NightVision CLI and logged in, you'll come to the main page, where you'll be presented with two options:
- [API Discovery](#api-discovery)
- [API Security Testing](#api-security-testing)

<img style="width: 300px;" alt="Main page" src="docs/main_page.png" />

### API Discovery

The **API Discovery** helps you document and discover hidden endpoints in your APIs for a set of different languages such as Java, C# (.net), Python, JavaScript / TypeScript and Ruby.
The process is straightforward:
1. Provide the filepath to the root directory of your project to be scanned;
2. Choose the language in which your API is written;
3. Press the button to generate the OpenAPI specification for your project.

If successful, a new window in your VSCode will open with your API information and you can save it at your convenience.

As an example, we can use the [javaspringvulny repository](https://github.com/vulnerable-apps/javaspringvulny):
1. Clone the repo: `git clone https://github.com/vulnerable-apps/javaspringvulny.git`;
2. Copy the filepath or select the parent folder;
3. Select the **Java** language.

When generating the OpenAPI specification, you should see something similar to the image below:

<img style="width: 400px;" alt="API Discovery Example" src="docs/api_discovery_example.png" />

### API Security Testing

Here you'll be able to configure and run DAST scans, discovering vulnerabilities in your system.

The image below shows the available options for us to configure our scans. In order to execute a DAST scan, we must first have in place a **project** and a **target**. If you have authentication in your system, you may have to configure an **authentication** method.

<img style="width: 300px;" alt="API Security Testing" src="docs/api_security_testing_main_page.png" />

### Usage example

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
