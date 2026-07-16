# NightVision Visual Studio Code Extension

<p align="center">
    <img width="150" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/nvlogo.png" />
</p>

Leverage [NightVision](https://nightviz.ai/) to document APIs, run [DAST](https://nightviz.ai/blog/the-essential-role-of-dynamic-application-security-testing-dast-in-complementing-static-application-security-testing-sast) scans, and uncover vulnerabilities in both known and unknown endpoints!

[![VSCode Extension](https://img.shields.io/badge/VSCode_Extension-Install-blue)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)
[![Installs-count](https://vsmarketplacebadges.dev/installs-short/nvsecurity.nightvision.png)](https://marketplace.visualstudio.com/items?itemName=nvsecurity.nightvision)

## Getting Started

In order to use this extension you must have a **NightVision account**. Additionally, it will be required to install the NightVision CLI, that can be done either through this extension or [manually](https://docs.nightviz.ai/welcome/tutorials-and-guides/installing-the-cli/). It is available for all platforms: Windows, Linux and MacOS.

### Main page

If you have installed the NightVision CLI and logged in, you'll arrive at the main page, where you'll be presented with these options:

1. [API Discovery](#api-discovery)
2. [API and Web Security Testing](#api-and-web-security-testing)
   - [Configuring a project](#configuring-a-project)
   - [Configuring a target](#configuring-a-target)
   - [Configuring an authentication](#configuring-an-authentication)
   - [Configuring a scan](#configuring-a-scan)

<img width="500" alt="Main page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/main_page.png" />



### API Discovery

The **API Discovery** helps you document and discover hidden endpoints in your APIs for a set of different languages such as C# (.net), Go, Java, JavaScript/TypeScript, PHP, Python and Ruby.
The process is straightforward:
1. Provide the filepath to the root directory of your project to be scanned (it defaults to the workspace you have open);
2. Choose the language in which your API is written, or keep **All languages** to discover endpoints across every supported language;
3. Choose the output file format (YAML or JSON);
4. Press **Generate OpenAPI Spec** to generate the OpenAPI specification for your project.

If successful, a new window in your VSCode will open with your API information and you can save it at your convenience.

As an example, we can use the [javaspringvulny repository](https://github.com/vulnerable-apps/javaspringvulny):
1. Clone the repo: `git clone https://github.com/vulnerable-apps/javaspringvulny.git`
2. Copy the filepath or select the parent folder;
3. Select **Java** as the API language.

When generating the OpenAPI specification, you should see something similar to the image below:

<img alt="API Discovery Example" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/api_discovery_example.png" />

### API and Web Security Testing

Here you'll be able to configure and run DAST scans, discovering vulnerabilities in your system.

In order to execute a DAST scan, we must first have in place a **project** and a **target**. If you have authentication in your system, you may have to configure an **authentication** method as well.

#### Configuring a project

1. Click on **Create Project**:

    <img width="500" alt="Projects page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/project_1.png" />

2. Type your project name, e.g. **Tutorial_test_project**

    <img width="500" alt="Projects page - Creating a project" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/project_2.png" />

3. Select the project.

4. (Optional) Select your project from the list to see its information and see options to edit, delete or share your project with other users:

    <img width="500" alt="Projects page - Project options" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/project_4.png" />

#### Configuring a target

Let's use the [javaspringvulny repository](https://github.com/vulnerable-apps/javaspringvulny) for this example. The application can be started through Docker: `docker-compose up -d; sleep 10`. The screenshots below use NightVision's hosted instance of the same app at `https://javaspringvulny.nvtest.io:9000/`; when following along locally, use `https://localhost:9000` instead.

Now, let's create our target.

1. Click on **Create Target**:

    <img width="500" alt="Targets page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/target_1.png" />

2. Choose the target type: a **Web Target** needs just a name and the URL of the website to scan, while an **API Target** also takes an API specification, provided either as a **Spec URL** or a **Spec File** (a Swagger/OpenAPI file or Postman Collection, such as the one produced in the [API Discovery section](#api-discovery)). Select **API Target**, fill in the data and press the **Create** button:

    <img width="500" alt="Targets page - API Target" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/target_2.png" />

3. Once created, you may see it in the list of targets. You can click on a target to see its details.

4. You can see the target details. By default, if no excluded URL patterns are provided, some default ones are applied:

    <img width="500" alt="Targets page - details" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/target_4.png" />

#### Configuring an authentication

If your website or API is protected by an authentication, we can configure it so the security scan is able to access and reveal issues behind protected endpoints. Three authentication types are available: **Cookie**, **Header** and **Playwright** (recorded by performing the login in a browser). This example uses Playwright.

1. Click on **Create Authentication**.

2. Select **Playwright** authentication and fill in the information as shown below. Make sure your app is running in the provided URL and press **Create**:

    <img width="500" alt="Authentications page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/authentication_2.png" />

3. The browser and Playwright Inspector will show up. In the browser we perform actions, and Playwright will take notes of them to record our authentication. In the main page that shows up, let's click in **Form Auth**.

4. Provide the user `user` and the password `password`, and then click **Submit**.

5. After submitting, you'll see our authentication has been recorded.

6. Close the browser where the application is running to save the recordings. You should be able to see your new authentication being listed:

    <img width="500" alt="Authentications page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/authentication_6.png" />

7. By clicking on it you can check its information:

    <img width="500" alt="Authentications page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/authentication_7.png" />

#### Configuring a scan

1. Click on **Scan APIs** to scan an API Target, or **Scan Web Applications** to scan a Web Target. Our example target is an API, so click on **Scan APIs**:

    <img width="500" alt="Scans page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/scan_1.png" />

2. Configure your scan by selecting the project, target and authentication we created before, and press **Start Scan**:

    <img width="500" alt="Scans page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/scan_2.png" />

3. Your scan will start and it may take a few minutes to start showing discovered vulnerabilities.

4. You can also check the existing scans' statuses in the main *Scans* page:

    <img width="500" alt="Scans page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/scan_4.png" />

5. Once it is done, you may check the discovered vulnerabilities:

    <img width="500" alt="Scans page" src="https://raw.githubusercontent.com/nvsecurity/nightvision-vscode/HEAD/docs/images/scan_5.png" />