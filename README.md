# NightVision Visual Studio Code Extension

A VSCode extension for the NightVision CLI.

## Getting Started

### Prerequisites

- [NightVision CLI](https://docs.nightvision.net/docs/installing-the-cli)
- Visual Studio Code (VSCode) version 1.75.0 or greater

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/spatiag/nightvision.git
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

### Running the application

1. Start the server
   ```sh
   npm run watch
   ```
2. Open the repo in VSCode
3. Run and Debug (Press `F5`) to open a new window with the extension loaded
